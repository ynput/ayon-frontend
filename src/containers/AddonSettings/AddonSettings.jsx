import { useState, useMemo, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'

import {
  Button,
  Spacer,
  Section,
  InputText,
  Panel,
  Toolbar,
  ScrollPanel,
} from '@ynput/ayon-react-components'
import { Splitter, SplitterPanel } from 'primereact/splitter'

import AddonList from '/src/containers/AddonList'
import SiteList from '/src/containers/SiteList'
import AddonSettingsPanel from './AddonSettingsPanel'
import SettingsChangesTable from './SettingsChangesTable'

import {
  useSetAddonSettingsMutation,
  useDeleteAddonSettingsMutation,
  useModifyAddonOverrideMutation,
} from '/src/services/addonSettings'
import SaveButton from '/src/components/SaveButton'
import { useGetBundleListQuery } from '/src/services/bundles'
import { isEqual } from 'lodash'

/*
 * key is {addonName}|{addonVersion}|{environment}|{siteId}|{projectKey}
 * if project name or siteid is N/a, use _ instead
 */

const getValueByPath = (obj, path) => {
  // path is an array of keys
  // e.g. ['a', 'b', 'c'] => obj.a.b.c
  // if any key is not found, return undefined

  if (path?.length === 0) return obj
  let value = obj
  for (const key of path) {
    if (value === undefined) return undefined
    value = value[key]
  }
  return value
}

const setValueByPath = (obj, path, value) => {
  const result = { ...obj }
  if (path?.length === 0) return value
  let target = result
  for (const key of path.slice(0, -1)) {
    if (target[key] === undefined) target[key] = {}
    target = target[key]
  }
  target[path[path.length - 1]] = value
  return result
}

const sameKeysStructure = (obj1, obj2) => {
  for (const type of ['string', 'number', 'boolean']) {
    if (typeof obj1 === type && typeof obj2 === type) {
      return true
    }
  }
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false
  const obj1Keys = Object.keys(obj1)
  const obj2Keys = Object.keys(obj2)
  if (obj1Keys.length !== obj2Keys.length) {
    console.warn('Len cond failed on ', obj1Keys, obj2Keys)
    return false
  }
  for (const key of obj1Keys) {
    // Let's allow this and see what happens
    // if (!obj2Keys.includes(key)) return false

    if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
      if (Array.isArray(obj1[key]) && Array.isArray(obj2[key])) continue // just assume someone won't paste invalid array items here

      if (!sameKeysStructure(obj1[key], obj2[key])) {
        console.warn('Struct cond failed on ', obj1[key], obj2[key])
        return false
      }
    }
  }
  return true
}

const compareObjects = (obj1, obj2, path = []) => {
  // Compare two objects and return a list of 'paths' where the objects differ
  const changedPaths = []
  for (const key in obj1) {
    const newPath = [...path, key]

    if (!(key in obj2)) {
      changedPaths.push(newPath)
      continue
    }

    const value1 = obj1[key]
    const value2 = obj2[key]

    if (typeof value1 === 'object' && typeof value2 === 'object') {
      if (Array.isArray(value1) && Array.isArray(value2)) {
        if (!isEqual(value1, value2)) {
          changedPaths.push(newPath)
        }
      } else {
        const nestedPaths = compareObjects(value1, value2, newPath)
        changedPaths.push(...nestedPaths)
      }
    } else if (value1 !== value2) {
      changedPaths.push(newPath)
    }
  }
  for (const key in obj2) {
    const newPath = [...path, key]
    if (!(key in obj1)) {
      changedPaths.push(newPath)
    }
  }
  return changedPaths
}

const AddonSettings = ({ projectName, showSites = false }) => {
  const [showHelp, setShowHelp] = useState(false)
  const [selectedAddons, setSelectedAddons] = useState([])
  const [originalData, setOriginalData] = useState({})
  const [localData, setLocalData] = useState({})
  const [localOverrides, setLocalOverrides] = useState({})
  const [currentSelection, setCurrentSelection] = useState(null)
  const [selectedSites, setSelectedSites] = useState([])
  const [environment, setEnvironment] = useState('production')

  const [setAddonSettings, { isLoading: setAddonSettingsUpdating }] = useSetAddonSettingsMutation()
  const [deleteAddonSettings] = useDeleteAddonSettingsMutation()
  const [modifyAddonOverride] = useModifyAddonOverrideMutation()

  const uriChanged = useSelector((state) => state.context.uriChanged)

  // bundles are used just to get the current bundle name
  // actual list of addons comes from getAddonList
  // TODO: unify in the future?
  // The problem: bundle does not contain addon titles (just name and version)
  const { data: bundleList } = useGetBundleListQuery()

  const bundleName = useMemo(() => {
    if (!bundleList) return null
    const bundle = bundleList.find((bundle) =>
      environment === 'staging' ? bundle.isStaging : bundle.isProduction,
    )
    return bundle ? bundle.name : null
  }, [bundleList, environment])

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
    const key = `${addonName}|${addonVersion}|${variant}${siteId}|${projectKey}`
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

  const onSetChangedKeys = (addonName, addonVersion, variant, siteId, data) => {
    setLocalOverrides((localOverrides) => {
      const key = `${addonName}|${addonVersion}|${variant}|${siteId}|${projectKey}`
      if (!data?.length) {
        delete localOverrides[key]
      } else {
        localOverrides[key] = data
      }
      return { ...localOverrides }
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

    for (const key in localOverrides) {
      if (!localOverrides[key]?.length) continue
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
        toast.error(`Unable to save ${variant} settings of ${addonName} ${addonVersion} `)
        console.error(e)
      }
    } // for key in localData

    setLocalOverrides((overrides) => {
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
    const keys = Object.keys(localOverrides)
    setLocalOverrides({})
    reloadAddons(keys)
  } // end of onDismissChanges

  const onRevertChange = (keysToRevert) => {
    // keys to revert is a dict {addonKey: [ [path, to, change1], [path, to, change2] ]}
    for (const addonKey in keysToRevert) {
      for (const path of keysToRevert[addonKey]) {
        setLocalData((localData) => {
          const returnValue = getValueByPath(originalData[addonKey], path)
          localData[addonKey] = setValueByPath(localData[addonKey], path, returnValue)
          console.log('REVERT ', path, 'TO', returnValue)
          return { ...localData }
        }) // setLocalData
        setLocalOverrides((localOverrides) => {
          const index = (localOverrides[addonKey] || []).indexOf(path)
          if (index > -1) {
            localOverrides[addonKey].splice(index, 1)
          }
          if (!localOverrides[addonKey]?.length) {
            delete localOverrides[addonKey]
          }
          return { ...localOverrides }
        }) // setLocalOverrides
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

    const newOverrides = { ...localOverrides }
    const no = compareObjects(localData[key], newData[key])
    newOverrides[key] = no

    setLocalOverrides(newOverrides)
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

  //
  // RENDER
  //

  const addonListHeader = useMemo(() => {
    const onSetEnvironment = (env) => {
      // if (Object.keys(localOverrides).length) {
      //   toast.error('Cannot change environment with unsaved changes')
      //   return
      // }
      setEnvironment(env)
    }

    const styleHlProd = {
      backgroundColor: 'var(--color-hl-production)',
      color: 'black',
    }
    const styleHlStag = {
      backgroundColor: 'var(--color-hl-staging)',
      color: 'black',
    }

    return (
      <Toolbar>
        <Button
          label="Production"
          onClick={() => onSetEnvironment('production')}
          disabled={environment === 'production'}
          style={environment === 'production' ? styleHlProd : {}}
        />
        <Button
          label="Staging"
          onClick={() => onSetEnvironment('staging')}
          disabled={environment === 'staging'}
          style={environment === 'staging' ? styleHlStag : {}}
        />
        <InputText
          tooltip="Bundle name"
          value={bundleName || ''}
          style={{ flexGrow: 1 }}
          readOnly
        />
      </Toolbar>
    )
  }, [environment, localOverrides, bundleName])

  const settingsListHeader = useMemo(() => {
    return (
      <Toolbar>
        <Button
          onClick={() => {
            setShowHelp(!showHelp)
          }}
          icon="help"
        />
      </Toolbar>
    )
  }, [showHelp, currentSelection, localOverrides])

  const canCommit = useMemo(() => Object.keys(localOverrides).length > 0, [localOverrides])

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
        <Section style={{ maxWidth: 400 }}>
          {addonListHeader}
          <AddonList
            selectedAddons={selectedAddons}
            setSelectedAddons={onSelectAddon}
            environment={environment}
            onAddonChanged={onAddonChanged}
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
                            onSetChangedKeys(addon.name, addon.version, addon.variant, siteId, data)
                          }
                          localData={localData[key]}
                          changedKeys={localOverrides[key]}
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
        <Section className="wrap" style={{ minWidth: 300 }}>
          <Toolbar>{commitToolbar}</Toolbar>
          <SettingsChangesTable changes={localOverrides} onRevert={onRevertChange} />
        </Section>
      </SplitterPanel>
    </Splitter>
  )

  /*
          <ScrollPanel className="transparent nopad" style={{ flexGrow: 1 }}>
            <pre>{JSON.stringify(localData, null, 2)}</pre>
          </ScrollPanel>
  */
}

export default AddonSettings
