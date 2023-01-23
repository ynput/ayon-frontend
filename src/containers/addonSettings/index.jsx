import axios from 'axios'

import { useState, useMemo } from 'react'
import { toast } from 'react-toastify'
//import ReactMarkdown from 'react-markdown'

import { Button, Spacer, Section, Panel, Toolbar, ScrollPanel } from '@ynput/ayon-react-components'

import AddonList from '/src/containers/AddonList'
import SiteList from '/src/containers/SiteList'
import AddonSettingsPanel from './addonSettingsPanel'

import { useSetAddonSettingsMutation } from '/src/services/addonSettings'

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

  const onSave = () => {
    for (const key in localData) {
      const [addonName, addonVersion, siteId, projectName] = key.split('|')
      if (projectName !== projectKey) continue

      setAddonSettings({
        addonName,
        addonVersion,
        projectName,
        siteId,
        data: localData[key],
      })

      /*
      let url = `/api/addons/${addonName}/${addonVersion}/settings`
      if (projectName !== '_') {
        url += `/${projectName}`
        if (siteId && siteId !== '_') url += `?site=${siteId}`
      }

      axios
        .post(url, localData[key])
        .then(() => {
          setLocalOverrides({})
          setLocalData({})
        })
        .catch((err) => {
          toast.error(
            <ReactMarkdown>
              {`Unable to save ${addonName} ${addonVersion} settings

${err.response?.data?.detail}`}
            </ReactMarkdown>,
          )
          console.log(err)
        })
        .finally(() => {
          forceAddonReload(addonName, addonVersion, siteId || '_')
        })
      */
    }
  }

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

  const onRemoveOverrides = (addonName, addonVersion, siteId) => {
    let url = `/api/addons/${addonName}/${addonVersion}/overrides`
    if (projectKey !== '_') {
      url += `/${projectKey}`
      if (siteId && siteId !== '_') url += `?site=${siteId}`
    }
    console.log('REMOVE OVERRIDES', url)
    axios
      .delete(url)
      .then(() => {
        onDismissChanges(addonName, addonVersion, siteId)
      })
      .catch((err) => {
        toast.error(err.response?.data?.detail || 'Unable to remove overrides')
      })
      .finally(() => {
        forceAddonReload(addonName, addonVersion, siteId || '_')
      })
  }

  const deleteOverride = (addon, siteId, path) => {
    console.log('DELETING OVERRIDE', path)

    let url = `/api/addons/${addon.name}/${addon.version}/overrides`
    if (projectKey !== '_') {
      url += `/${projectKey}`
      if (siteId && siteId !== '_') url += `?site=${siteId}`
    }

    axios
      .post(url, { action: 'delete', path: path })
      .catch((err) => {
        toast.error(err.response?.data?.detail || 'Unable to delete a override')
      })
      .then(() => {
        console.log('Override deleted')
      })
      .finally(() => {
        forceAddonReload(addon.name, addon.version, siteId || '_')
      })
  }

  const pinOverride = (addon, siteId, path) => {
    // TODO: support site
    console.log('PINNING OVERRIDE', path)

    let url = `/api/addons/${addon.name}/${addon.version}/overrides`
    if (projectKey !== '_') {
      url += `/${projectKey}`
      if (siteId && siteId !== '_') url += `?site=${siteId}`
    }

    axios
      .post(url, { action: 'pin', path: path })
      .catch((err) => {
        toast.error(err.response?.data?.detail || 'Unable to pin a override')
      })
      .then(() => {
        console.log('Override deleted')
      })
      .finally(() => {
        forceAddonReload(addon.name, addon.version, siteId || '_')
      })
  }

  //
  // RENDER
  //

  const settingsListHeader = useMemo(() => {
    return (
      <Toolbar>
        <Button icon="content_copy" disabled={true} />
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
          disabled={
            !currentSelection?.addon?.name ||
            currentSelection.hasOverride ||
            (localOverrides[currentSelection.addonString] || []).includes(currentSelection.fieldId)
          }
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
