import { useState, useMemo, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'

import {
  Button,
  Spacer,
  Section,
  Panel,
  Toolbar,
  ScrollPanel,
  SaveButton,
} from '@ynput/ayon-react-components'
import { Splitter, SplitterPanel } from 'primereact/splitter'

import AddonList from '/src/containers/AddonList'
import SiteList from '/src/containers/SiteList'
import AddonSettingsPanel from './AddonSettingsPanel'
import SettingsChangesTable from './SettingsChangesTable'
import CopySettingsButton from './CopySettings'
import VariantSelector from './VariantSelector'

import {
  useSetAddonSettingsMutation,
  useDeleteAddonSettingsMutation,
  useModifyAddonOverrideMutation,
} from '/src/services/addonSettings'

import { usePromoteBundleMutation } from '/src/services/bundles'
import { confirmDialog } from 'primereact/confirmdialog'

import { getValueByPath, setValueByPath, sameKeysStructure, compareObjects } from './utils'
import arrayEquals from '/src/helpers/arrayEquals'

/*
 * key is {addonName}|{addonVersion}|{environment}|{siteId}|{projectKey}
 * if project name or siteid is N/a, use _ instead
 */

const isChildPath = (childPath, parentPath) => {
  if (childPath.length < parentPath.length) return false
  for (let i = 0; i < parentPath.length; i++) {
    if (childPath[i] !== parentPath[i]) return false
  }
  return true
}

const AddonSettings = ({ projectName, showSites = false }) => {
  //const navigate = useNavigate()
  const [showHelp, setShowHelp] = useState(false)
  const [selectedAddons, setSelectedAddons] = useState([])
  const [originalData, setOriginalData] = useState({})
  const [localData, setLocalData] = useState({})
  const [changedKeys, setChangedKeys] = useState({})
  const [currentSelection, setCurrentSelection] = useState(null)
  const [selectedSites, setSelectedSites] = useState([])
  const [environment, setEnvironment] = useState('production')
  const [bundleName, setBundleName] = useState()

  const [setAddonSettings, { isLoading: setAddonSettingsUpdating }] = useSetAddonSettingsMutation()
  const [deleteAddonSettings] = useDeleteAddonSettingsMutation()
  const [modifyAddonOverride] = useModifyAddonOverrideMutation()
  const [promoteBundle] = usePromoteBundleMutation()

  const uriChanged = useSelector((state) => state.context.uriChanged)

  const projectKey = projectName || '_'

  useEffect(() => {
    const url = new URL(window.location.href)
    const addonName = url.searchParams.get('addonName')
    const addonVersion = url.searchParams.get('addonVersion')
    const addonString = `${addonName}@${addonVersion}`
    const siteId = url.searchParams.get('site')
    const path = url.searchParams.get('settingsPath')?.split('|') || []
    const fieldId = path.length ? `root_${path.join('_')}` : 'root'

    if (addonName && addonVersion) {
      setCurrentSelection({
        addonName,
        addonVersion,
        addonString,
        siteId,
        path,
        fieldId,
      })
    } else {
      setCurrentSelection(null)
    }
  }, [uriChanged])

  const onSettingsLoad = (addonName, addonVersion, variant, siteId, data) => {
    const key = `${addonName}|${addonVersion}|${variant}|${siteId}|${projectKey}`
    if (key in originalData) return
    setOriginalData((localData) => {
      localData[key] = data
      return { ...localData }
    })
  }

  const onSettingsChange = (addonName, addonVersion, variant, siteId, data) => {
    const key = `${addonName}|${addonVersion}|${variant}|${siteId}|${projectKey}`

    setLocalData((localData) => {
      localData[key] = data
      return { ...localData }
    })
  }

  const updateChangedKeys = (addonName, addonVersion, variant, siteId, data) => {
    // data is a list of [{path:list, isChanged: bool}]

    if (data.length === 0) return
    if (data.length === 1 && !data[0].path?.length) return

    setChangedKeys((changedKeys) => {
      const key = `${addonName}|${addonVersion}|${variant}|${siteId}|${projectKey}`
      const keyData = changedKeys[key] || []

      for (const item of data) {
        const index = keyData.findIndex((keyItem) => arrayEquals(keyItem, item.path))
        if (index === -1 && item.isChanged) {
          keyData.push(item.path)
        } else if (index > -1 && !item.isChanged) {
          keyData.splice(index, 1)
        }
      }

      if (!keyData.length) {
        delete changedKeys[key]
        return { ...changedKeys }
      }

      return { ...changedKeys, [key]: keyData }
    })
  }

  const reloadAddons = (keys) => {
    setLocalData((localData) => {
      const newData = {}
      for (const key in localData) {
        if (keys.includes(key)) {
          continue
        }
        newData[key] = localData[key]
      }
      return newData
    })
  }

  const onAddonChanged = (addonName) => {
    // TODO: deprecated?
    // not sure why this is here. I think it was used to reload addons when
    // an addon was changed ouside the form (e.g. copying settings using addon list ctx menu)
    // But we should probably get rid of outside changes
    console.warn('Called onAddonChanged. This is deprecated.')
    for (const key in localData) {
      if (addonName === key.split('|')[0]) {
        reloadAddons([key])
      }
    }
  }

  const onSave = async () => {
    let updatedKeys = []
    let allOk = true

    for (const key in changedKeys) {
      if (!changedKeys[key]?.length) continue
      const [addonName, addonVersion, variant, siteId, projectName] = key.split('|')

      try {
        const payload = {
          addonName,
          addonVersion,
          projectName,
          siteId,
          variant,
          data: localData[key],
        }
        await setAddonSettings(payload).unwrap()

        updatedKeys.push(key)
      } catch (e) {
        allOk = false
        console.error(e)
        toast.error(
          <>
            <strong>Unable to save {variant} settings</strong>
            <br />
            {addonName} {addonVersion}
            <br />
            {e.detail}
            {e.errors?.length && (
              <ul>
                {e.errors.map((error, i) => (
                  <li key={i}>
                    {error.loc.join('/')}: {error.msg}
                  </li>
                ))}
              </ul>
            )}
          </>,
        )
      }
    } // for key in localData

    setChangedKeys((overrides) => {
      const newOverrides = {}
      for (const key in overrides) {
        if (updatedKeys.includes(key)) continue
        newOverrides[key] = overrides[key]
      }
      return newOverrides
    })

    reloadAddons(updatedKeys)

    if (allOk) {
      toast.success('Settings saved')
    }
  } // onSave

  const onRevertAllChanges = () => {
    const keys = Object.keys(changedKeys)
    setChangedKeys({})
    reloadAddons(keys)
  } // end of onDismissChanges

  const onRevertChange = (keysToRevert) => {
    // keys to revert is a dict {addonKey: [ [path, to, change1], [path, to, change2] ]}
    for (const addonKey in keysToRevert) {
      for (const path of keysToRevert[addonKey]) {
        setLocalData((localData) => {
          const returnValue = getValueByPath(originalData[addonKey], path)
          console.log('REVERT ', path, 'TO', returnValue)
          try {
            localData[addonKey] = setValueByPath(localData[addonKey], path, returnValue)
          } catch (e) {
            console.error(e)
          }
          return { ...localData }
        }) // setLocalData
        setChangedKeys((changedKeys) => {
          const addonChanges = changedKeys[addonKey] || []
          // delete the path from the list of changed keys
          // also delete all children of this path

          for (const index in addonChanges) {
            if (isChildPath(addonChanges[index], path)) {
              addonChanges.splice(index, 1)
            }
          }

          if (!addonChanges.length) {
            delete changedKeys[addonKey]
            return { ...changedKeys }
          }

          return { ...changedKeys, [addonKey]: addonChanges }
        }) // setChangedKeys
      }
    }
  }

  // Context menu actions

  const onRemoveOverride = async (addon, siteId, path) => {
    // Remove a single override for this addon (within current project and environment)
    // path is an array of strings
    try {
      await modifyAddonOverride({
        addonName: addon.name,
        addonVersion: addon.version,
        projectName: projectKey,
        siteId,
        path,
        variant: addon.variant,
        action: 'delete',
      }).unwrap()
    } catch (e) {
      toast.error(`Unable to remove ${addon.variant} override of ${addon.name} ${addon.version} `)
      console.error(e)
      return
    }

    toast.success('Override removed')
    reloadAddons([`${addon.name}|${addon.version}|${addon.variant}|${siteId || '_'}|${projectKey}`])
  }

  const onRemoveAllOverrides = async (addon, siteId) => {
    // Remove all overrides for this addon (within current project and environment)
    try {
      await deleteAddonSettings({
        addonName: addon.name,
        addonVersion: addon.version,
        projectName: projectKey,
        variant: addon.variant,
        siteId,
      }).unwrap()
    } catch (e) {
      toast.error(`Unable to remove overrides of ${addon.name} ${addon.version} `)
      console.error(e)
      return
    }
    toast.success('Overrides removed')
    reloadAddons([`${addon.name}|${addon.version}|${addon.variant}|${siteId || '_'}|${projectKey}`])
  }

  const onPinOverride = async (addon, siteId, path) => {
    try {
      await modifyAddonOverride({
        addonName: addon.name,
        addonVersion: addon.version,
        projectName: projectKey,
        siteId,
        path,
        variant: addon.variant,
        action: 'pin',
      }).unwrap()
    } catch (e) {
      toast.error(`Unable to pin override of ${addon.name} ${addon.version} `)
      console.error(e)
      return
    }
    toast.success('Override pinned')
    reloadAddons([`${addon.name}|${addon.version}|${addon.variant}|${siteId || '_'}|${projectKey}`])
  }

  const pushValueToPath = (addon, siteId, path, value) => {
    // Push a value to a given path of the settings
    // Validate that the value is compatible with the existing value

    const key = `${addon.name}|${addon.version}|${addon.variant}|${siteId || '_'}|${
      projectKey || '_'
    }`
    const allData = localData[key]
    if (!allData) {
      toast.error('No data to paste')
      return
    }
    const oldValue = getValueByPath(allData, path)
    if (oldValue === undefined) {
      toast.error('No data to paste')
      return
    }

    if (!sameKeysStructure(oldValue, value)) {
      toast.error('Icompatible data structure')
      return
    }

    const newData = { ...localData }
    const nk = setValueByPath(localData[key], path, value)
    newData[key] = nk

    const newChangedKeys = { ...changedKeys }
    const no = compareObjects(localData[key], newData[key])
    newChangedKeys[key] = no

    setChangedKeys(newChangedKeys)
    setLocalData(newData)
  }

  const onPasteValue = async (addon, siteId, path) => {
    const text = await navigator.clipboard.readText()
    let value
    try {
      value = JSON.parse(text)
    } catch (e) {
      toast.error('Cannot paste, invalid clipboard contents')
      return
    }
    pushValueToPath(addon, siteId, path, value)
  } // paste

  const onPushToProduction = async () => {
    // Push the current bundle to production

    confirmDialog({
      header: `Push ${bundleName} to production`,
      message: `Are you sure you want to push ${bundleName} to production?`,
      accept: async () => {
        await promoteBundle({ name: bundleName }).unwrap()
        setLocalData({})
        toast.success('Bundle pushed to production')
        setEnvironment('production')
      },
      reject: () => {},
    })
  }

  //
  // RENDER
  //

  const canCommit = useMemo(() => Object.keys(changedKeys).length > 0, [changedKeys])

  const addonListHeader = useMemo(() => {
    // site settings do not have variants
    if (showSites) return

    return (
      <>
        <Toolbar>
          <VariantSelector variant={environment} setVariant={setEnvironment} />
          <Spacer />
        </Toolbar>
        <Toolbar>
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {bundleName}
          </span>
          <Spacer />
          <CopySettingsButton
            bundleName={bundleName}
            variant={environment}
            disabled={canCommit}
            localData={localData}
            changedKeys={changedKeys}
            setLocalData={setLocalData}
            setChangedKeys={setChangedKeys}
            setSelectedAddons={setSelectedAddons}
            originalData={originalData}
            setOriginalData={setOriginalData}
            projectName={projectName}
          />
          <Button
            icon="local_shipping"
            tooltip="rocket_launch"
            onClick={onPushToProduction}
            disabled={environment !== 'staging' || canCommit}
            style={{ zIndex: 100 }}
          />
        </Toolbar>
      </>
    )
  }, [environment, changedKeys, bundleName, environment, projectName])

  const settingsListHeader = useMemo(() => {
    return (
      <Toolbar>
        <Spacer />
        <Button
          onClick={() => {
            setShowHelp(!showHelp)
          }}
          icon="help"
        />
      </Toolbar>
    )
  }, [showHelp, currentSelection, changedKeys])

  const commitToolbar = useMemo(
    () => (
      <>
        <Spacer />
        <Button
          label="Clear Changes"
          icon="clear"
          onClick={onRevertAllChanges}
          disabled={!canCommit}
        />
        <SaveButton
          label="Save Changes"
          onClick={onSave}
          active={canCommit}
          saving={setAddonSettingsUpdating}
        />
      </>
    ),
    [onRevertAllChanges, onSave, canCommit],
  )

  const onSelectAddon = (newSelection) => {
    setSelectedAddons(newSelection)
    setCurrentSelection(null)
  }

  return (
    <Splitter layout="horizontal" style={{ width: '100%', height: '100%' }}>
      <SplitterPanel size={80} style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
        <Section style={{ maxWidth: 400, minWidth: 400 }}>
          {addonListHeader}
          <AddonList
            selectedAddons={selectedAddons}
            setSelectedAddons={onSelectAddon}
            environment={environment}
            onAddonChanged={onAddonChanged}
            setBundleName={setBundleName}
            changedAddonKeys={Object.keys(changedKeys || {})}
            projectName={projectName}
            siteSettings={showSites}
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
            <ScrollPanel className="transparent nopad" style={{ flexGrow: 1, minWidth: 750 }}>
              {selectedAddons
                .filter((addon) => addon.version)
                .reverse()
                .map((addon) => {
                  const sites = showSites ? (selectedSites.length ? selectedSites : []) : ['_']

                  return sites.map((siteId) => {
                    const key = `${addon.name}|${addon.version}|${addon.variant}|${siteId}|${projectKey}`

                    return (
                      <Panel
                        key={key}
                        style={{ flexGrow: 0 }}
                        className="transparent nopad"
                        size={1}
                      >
                        <AddonSettingsPanel
                          addon={addon}
                          onChange={(data) =>
                            onSettingsChange(addon.name, addon.version, addon.variant, siteId, data)
                          }
                          onLoad={(data) =>
                            onSettingsLoad(addon.name, addon.version, addon.variant, siteId, data)
                          }
                          onSetChangedKeys={(data) =>
                            updateChangedKeys(
                              addon.name,
                              addon.version,
                              addon.variant,
                              siteId,
                              data,
                            )
                          }
                          localData={localData[key]}
                          changedKeys={changedKeys[key]}
                          currentSelection={currentSelection}
                          onSelect={setCurrentSelection}
                          projectName={projectName}
                          siteId={siteId === '_' ? null : siteId}
                          context={{
                            headerProjectName: projectName,
                            headerSiteId: siteId === '_' ? null : siteId,
                            headerEnvironment: addon.variant,
                            onRemoveOverride: (path) => onRemoveOverride(addon, siteId, path),
                            onPinOverride: (path) => onPinOverride(addon, siteId, path),
                            onRemoveAllOverrides: () => onRemoveAllOverrides(addon, siteId),
                            onPasteValue: (path) => onPasteValue(addon, siteId, path),
                          }}
                        />
                      </Panel>
                    )
                  })
                })}

              <Spacer />
            </ScrollPanel>
          </Section>
        </Section>
      </SplitterPanel>
      <SplitterPanel>
        <Section wrap style={{ minWidth: 300 }}>
          <Toolbar>{commitToolbar}</Toolbar>
          <SettingsChangesTable changes={changedKeys} onRevert={onRevertChange} />
          {/*}
          <ScrollPanel className="transparent nopad" style={{ flexGrow: 1 }}>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(localData, null, 2)}</pre>
          </ScrollPanel>
          */}
        </Section>
      </SplitterPanel>
    </Splitter>
  )
}

export default AddonSettings
