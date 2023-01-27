import { useState, useMemo } from 'react'
import { toast } from 'react-toastify'
//import ReactMarkdown from 'react-markdown'

import { Button, Spacer, Section, Panel, Toolbar, ScrollPanel } from '@ynput/ayon-react-components'

import AddonList from '/src/containers/AddonList'
import SiteList from '/src/containers/SiteList'
import AddonSettingsPanel from './addonSettingsPanel'

import {
  useSetAddonSettingsMutation,
  useDeleteAddonSettingsMutation,
  useModifyAddonOverrideMutation,
} from '/src/services/addonSettings'

/*
 * key is {addonName}|{addonVersion}|{siteId}|{projectKey}
 * if project name or siteid is N/a, use _ instead
 */

const AddonSettings = ({ projectName, showSites = false }) => {
  const [showHelp, setShowHelp] = useState(false)
  const [selectedAddons, setSelectedAddons] = useState([])
  const [reloadTrigger, setReloadTrigger] = useState({})
  const [localData, setLocalData] = useState({})
  const [localOverrides, setLocalOverrides] = useState({})
  const [currentSelection, setCurrentSelection] = useState(null)
  const [selectedSites, setSelectedSites] = useState([])

  const [setAddonSettings] = useSetAddonSettingsMutation()
  const [deleteAddonSettings] = useDeleteAddonSettingsMutation()
  const [modifyAddonOverride] = useModifyAddonOverrideMutation()

  const projectKey = projectName || '_'

  const onSettingsChange = (addonName, addonVersion, siteId, data) => {
    setLocalData((localData) => {
      const key = `${addonName}|${addonVersion}|${siteId}|${projectKey}`
      localData[key] = data
      return { ...localData }
    })
  }

  const onSetChangedKeys = (addonName, addonVersion, siteId, data) => {
    setLocalOverrides((localOverrides) => {
      const key = `${addonName}|${addonVersion}|${siteId}|${projectKey}`
      localOverrides[key] = data
      return { ...localOverrides }
    })
  }

  const forceAddonReload = (addonName, addonVersion, siteId) => {
    setReloadTrigger((reloadTrigger) => {
      const now = new Date()
      const key = `${addonName}|${addonVersion}|${siteId}|${projectKey}`
      console.log('forceAddonReload', key)
      return {
        ...reloadTrigger,
        [key]: now,
      }
    })
  }

  const onSave = async () => {
    let updatedKeys = []
    let allOk = true

    for (const key in localData) {
      const [addonName, addonVersion, siteId, projectName] = key.split('|')
      if (projectName !== projectKey) continue

      try {
        await setAddonSettings({
          addonName,
          addonVersion,
          projectName,
          siteId,
          data: localData[key],
        }).unwrap()

        updatedKeys.push(key)
      } catch (e) {
        allOk = false
        toast.error(`Unable to save settings of ${addonName} ${addonVersion} `)
        console.error(e)
      }
    } // for key in localData

    setLocalData((localData) => {
      const newData = { ...localData }
      updatedKeys.forEach((key) => delete newData[key])
      return newData
    })

    setLocalOverrides((overrides) => {
      const newOverrides = { ...overrides }
      updatedKeys.forEach((key) => delete newOverrides[key])
      return newOverrides
    })

    if (allOk) {
      toast.success('Settings saved')
    }
  } // onSave

  const onDismissChanges = (addonName, addonVersion, siteId) => {
    const key = `${addonName}|${addonVersion}|${siteId}|${projectKey}`

    setLocalData((localData) => {
      const res = { ...localData }
      if (res[key]) delete res[key]
      return res
    })

    setLocalOverrides((overrides) => {
      const res = { ...overrides }
      if (res[key]) delete res[key]
      return res
    })

    forceAddonReload(addonName, addonVersion, siteId)
  } // end of onDismissChanges

  const onRemoveOverrides = async (addonName, addonVersion, siteId) => {
    try {
      await deleteAddonSettings({
        addonName,
        addonVersion,
        projectName: projectKey,
        siteId,
      }).unwrap()
    } catch (e) {
      toast.error(`Unable to remove overrides of ${addonName} ${addonVersion} `)
      console.error(e)
      return
    }
    toast.success('Overrides removed')
  }

  const deleteOverride = async (addon, siteId, path) => {
    try {
      await modifyAddonOverride({
        addonName: addon.name,
        addonVersion: addon.version,
        projectName: projectKey,
        siteId,
        path,
        action: 'delete',
      }).unwrap()
    } catch (e) {
      toast.error(`Unable to remove override of ${addon.name} ${addon.version} `)
      console.error(e)
      return
    }

    toast.success('Override removed')
  }

  const pinOverride = async (addon, siteId, path) => {
    try {
      await modifyAddonOverride({
        addonName: addon.name,
        addonVersion: addon.version,
        projectName: projectKey,
        siteId,
        path,
        action: 'pin',
      }).unwrap()
    } catch (e) {
      toast.error(`Unable to pin override of ${addon.name} ${addon.version} `)
      console.error(e)
      return
    }

    toast.success('Override pinned')
  }

  const copySelection = () => {
    const key = `${currentSelection.addon.name}|${currentSelection.addon.version}|${
      currentSelection.siteId || '_'
    }|${projectKey || '_'}`
    const data = localData[key]
    console.log('copySelection', key, data)
  }

  //
  // RENDER
  //

  const settingsListHeader = useMemo(() => {
    return (
      <Toolbar>
        <Button icon="content_copy" onClick={copySelection} />
        <Button icon="content_paste" disabled={true} />
        <Button
          icon="cancel"
          disabled={!currentSelection?.addon?.name}
          tooltip="Remove all addon overrides"
          onClick={() =>
            onRemoveOverrides(
              currentSelection.addon.name,
              currentSelection.addon.version,
              currentSelection.siteId,
            )
          }
        />
        <Button
          icon="push_pin"
          tooltip="Pin default value as an override"
          disabled={false}
          onClick={() =>
            pinOverride(currentSelection.addon, currentSelection.siteId, currentSelection.path)
          }
        />
        <Button
          icon="lock_reset"
          tooltip="Remove override from the selected field"
          disabled={!currentSelection?.addon?.name || !currentSelection.hasOverride}
          onClick={() =>
            deleteOverride(currentSelection.addon, currentSelection.siteId, currentSelection.path)
          }
        />

        <Spacer>
          {currentSelection && (
            <ul className="settings-breadcrumbs">
              <li>{currentSelection.addon?.name}</li>
              {(currentSelection?.path || []).map((breadcrumb, index) => (
                <li key={index}>{breadcrumb}</li>
              ))}
            </ul>
          )}
        </Spacer>

        <Button
          onClick={() => {
            setShowHelp(!showHelp)
          }}
          icon="help"
        />
      </Toolbar>
    )
  }, [showHelp, currentSelection, localOverrides])

  return (
    <>
      <Section style={{ maxWidth: 400 }}>
        <AddonList
          projectKey={projectKey}
          selectedAddons={selectedAddons}
          setSelectedAddons={setSelectedAddons}
          changedAddons={Object.keys(localData)}
          onDismissChanges={onDismissChanges}
          onRemoveOverrides={onRemoveOverrides}
        />
        {showSites && (
          <SiteList
            value={selectedSites}
            onChange={setSelectedSites}
            style={{ maxHeight: 300 }}
            multiselect={true}
          />
        )}
      </Section>

      <Section className={showHelp && 'settings-help-visible'}>
        {settingsListHeader}
        <Section>
          <ScrollPanel
            className="transparent nopad"
            style={{ flexGrow: 1 }}
            scrollStyle={{ padding: 0 }}
          >
            {selectedAddons
              .filter((addon) => addon.version)
              .reverse()
              .map((addon) => {
                const sites = showSites ? (selectedSites.length ? selectedSites : []) : ['_']

                return sites.map((siteId) => {
                  const key = `${addon.name}|${addon.version}|${siteId}|${projectKey}`
                  return (
                    <Panel key={key} style={{ flexGrow: 0 }} className="transparent nopad" size={1}>
                      <AddonSettingsPanel
                        addon={addon}
                        onChange={(data) =>
                          onSettingsChange(addon.name, addon.version, siteId, data)
                        }
                        onSetChangedKeys={(data) =>
                          onSetChangedKeys(addon.name, addon.version, siteId, data)
                        }
                        localData={localData[key]}
                        changedKeys={localOverrides[key]}
                        reloadTrigger={reloadTrigger[key]}
                        onSelect={setCurrentSelection}
                        projectName={projectName}
                        siteId={siteId === '_' ? null : siteId}
                      />
                    </Panel>
                  )
                })
              })}

            <Spacer />
          </ScrollPanel>
        </Section>
      </Section>

      <Section style={{ maxWidth: 300 }}>
        <Toolbar>
          <Spacer />
          <Button label="Revert changes" icon="refresh" onClick={onDismissChanges} />
          <Button label="Save changes" icon="check" onClick={onSave} />
        </Toolbar>
        <ScrollPanel style={{ flexGrow: 1 }}>
          <h3>Form data</h3>
          <pre style={{ width: '100%', flexGrow: 1 }}>{JSON.stringify(localData, null, 2)}</pre>
          <h3>Changed keys</h3>
          <pre style={{ width: '100%', flexGrow: 1 }}>
            {JSON.stringify(localOverrides, null, 2)}
          </pre>
        </ScrollPanel>
      </Section>
    </>
  )
}

export default AddonSettings
