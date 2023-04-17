import { useState, useMemo } from 'react'
import { toast } from 'react-toastify'
import styled from 'styled-components'
//import ReactMarkdown from 'react-markdown'

import {
  Button,
  Spacer,
  Section,
  Panel,
  Toolbar,
  ScrollPanel,
  InputSwitch,
} from '@ynput/ayon-react-components'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { SelectButton } from 'primereact/selectbutton'

import AddonList from '/src/containers/AddonList'
import SiteList from '/src/containers/SiteList'
import AddonSettingsPanel from './AddonSettingsPanel'
import SettingsChangesTable from './SettingsChangesTable'

import {
  useSetAddonSettingsMutation,
  useDeleteAddonSettingsMutation,
  useModifyAddonOverrideMutation,
} from '/src/services/addonSettings'

const BreadcrumbsContainer = styled.div`
  flex-grow: 1;
  display: relative;
  display: flex;
  align-items: center;
  justify-content: center;
    span {
      max-width: 95&;
      margin-top: -10px
      height: 100%
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
`

const Breadcrumbs = (props) => (
  <BreadcrumbsContainer>
    <span>{props.children}</span>
  </BreadcrumbsContainer>
)

/*
 * key is {addonName}|{addonVersion}|{siteId}|{projectKey}
 * if project name or siteid is N/a, use _ instead
 */

const getValueByPath = (obj, path) => {
  // path is an array of keys
  // e.g. ['a', 'b', 'c'] => obj.a.b.c
  // if any key is not found, return undefined
  // if path is empty, return null (to indicate that the value is not set)

  if (path.length === 0) return null
  let value = obj
  for (const key of path) {
    if (value === undefined) return undefined
    value = value[key]
  }
  return value
}

const setValueByPath = (obj, path, value) => {
  const result = { ...obj }
  if (path.length === 0) return
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
  if (obj1Keys.length !== obj2Keys.length) return false
  for (const key of obj1Keys) {
    if (!obj2Keys.includes(key)) return false
    if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
      if (!sameKeysStructure(obj1[key], obj2[key])) return false
    }
  }
  return true
}

const AddonSettings = ({ projectName, showSites = false }) => {
  const [showHelp, setShowHelp] = useState(false)
  const [selectedAddons, setSelectedAddons] = useState([])
  const [reloadTrigger, setReloadTrigger] = useState({})
  const [originalData, setOriginalData] = useState({})
  const [localData, setLocalData] = useState({})
  const [localOverrides, setLocalOverrides] = useState({})
  const [currentSelection, setCurrentSelection] = useState(null)
  const [selectedSites, setSelectedSites] = useState([])
  const [environment, setEnvironment] = useState('production')
  const [showAllAddons, setShowAllAddons] = useState(false)

  const [setAddonSettings] = useSetAddonSettingsMutation()
  const [deleteAddonSettings] = useDeleteAddonSettingsMutation()
  const [modifyAddonOverride] = useModifyAddonOverrideMutation()

  const projectKey = projectName || '_'

  const onSettingsLoad = (addonName, addonVersion, siteId, data) => {
    const key = `${addonName}|${addonVersion}|${siteId}|${projectKey}`
    setOriginalData((localData) => {
      localData[key] = data
      return { ...localData }
    })
  }

  const onSettingsChange = (addonName, addonVersion, siteId, data) => {
    const key = `${addonName}|${addonVersion}|${siteId}|${projectKey}`
    setLocalData((localData) => {
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

  const reloadAddons = (keys) => {
    setReloadTrigger((reloadTrigger) => {
      for (const key of keys) {
        reloadTrigger[key] = new Date().getTime()
      }
      return { ...reloadTrigger }
    })
  }

  const onAddonChanged = (addonName) => {
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
      if (!localOverrides[key].length) continue
      const [addonName, addonVersion, siteId, projectName] = key.split('|')
      if (projectName !== projectKey) continue

      try {
        const payload = {
          addonName,
          addonVersion,
          projectName,
          siteId,
          environment,
          data: localData[key],
        }
        await setAddonSettings(payload).unwrap()

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

  const onRemoveOverrides = async (addonName, addonVersion, siteId) => {
    try {
      await deleteAddonSettings({
        addonName,
        addonVersion,
        projectName: projectKey,
        environment,
        siteId,
      }).unwrap()
    } catch (e) {
      toast.error(`Unable to remove overrides of ${addonName} ${addonVersion} `)
      console.error(e)
      return
    }
    toast.success('Overrides removed')
    reloadAddons([`${addonName}|${addonVersion}|${siteId || '_'}|${projectKey}`])
  }

  const deleteOverride = async (addon, siteId, path) => {
    try {
      await modifyAddonOverride({
        addonName: addon.name,
        addonVersion: addon.version,
        projectName: projectKey,
        siteId,
        path,
        environment,
        action: 'delete',
      }).unwrap()
    } catch (e) {
      toast.error(`Unable to remove override of ${addon.name} ${addon.version} `)
      console.error(e)
      return
    }

    toast.success('Override removed')
    reloadAddons([`${addon.name}|${addon.version}|${siteId || '_'}|${projectKey}`])
  }

  const pinOverride = async (addon, siteId, path) => {
    try {
      await modifyAddonOverride({
        addonName: addon.name,
        addonVersion: addon.version,
        projectName: projectKey,
        siteId,
        path,
        environment,
        action: 'pin',
      }).unwrap()
    } catch (e) {
      toast.error(`Unable to pin override of ${addon.name} ${addon.version} `)
      console.error(e)
      return
    }
    toast.success('Override pinned')
    reloadAddons([`${addon.name}|${addon.version}|${siteId || '_'}|${projectKey}`])
  }

  const copySelection = () => {
    const key = `${currentSelection.addon.name}|${currentSelection.addon.version}|${
      currentSelection.siteId || '_'
    }|${projectKey || '_'}`
    const allData = localData[key]
    if (!allData) {
      toast.error('No data to copy')
      return
    }
    const value = getValueByPath(allData, currentSelection.path)
    if (value === undefined) {
      toast.error('No data to copy')
      return
    }

    const text = JSON.stringify(value, null, 2)
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const pasteSelection = async () => {
    const key = `${currentSelection.addon.name}|${currentSelection.addon.version}|${
      currentSelection.siteId || '_'
    }|${projectKey || '_'}`
    const allData = localData[key]
    if (!allData) {
      toast.error('No data to paste')
      return
    }
    const oldValue = getValueByPath(allData, currentSelection.path)
    if (oldValue === undefined) {
      toast.error('No data to paste')
      return
    }

    const text = await navigator.clipboard.readText()

    let newValue
    try {
      newValue = JSON.parse(text)
    } catch (e) {
      toast.error('Cannot paste, invalid clipboard contents')
      return
    }

    if (!sameKeysStructure(oldValue, newValue)) {
      toast.error('Cannot paste, incompatible data structure')
      return
    }

    setLocalOverrides((overrides) => {
      const newOverrides = { ...overrides }
      newOverrides[key] = newOverrides[key] || []
      newOverrides[key].push(currentSelection.path)
      return newOverrides
    })

    setLocalData((localData) => {
      const newData = { ...localData }
      const nk = setValueByPath(localData[key], currentSelection.path, newValue)
      newData[key] = nk
      return newData
    })
  } // paste

  //
  // RENDER
  //

  const addonListHeader = useMemo(() => {
    // do not use staging or version overrides on project level settings
    if (projectName) {
      return <></>
    }

    const environmentOptions = [
      { label: 'Production', value: 'production' },
      { label: 'Staging', value: 'staging' },
    ]

    return (
      <Toolbar>
        <SelectButton
          unselectable={false}
          value={environment}
          options={environmentOptions}
          onChange={(e) => {
            if (Object.keys(localOverrides).length) {
              toast.error('Cannot change environment with unsaved changes')
              return
            }
            setEnvironment(e.value)
          }}
        />
        <Spacer />
        <>
          Show all
          <InputSwitch
            checked={showAllAddons}
            onChange={() => setShowAllAddons(!showAllAddons)}
            tooltip="Show all addons"
          />
        </>
      </Toolbar>
    )
  }, [showAllAddons, environment, localOverrides])

  const settingsListHeader = useMemo(() => {
    return (
      <Toolbar>
        <Button icon="content_copy" onClick={copySelection} />
        <Button icon="content_paste" onClick={pasteSelection} />
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

        <Breadcrumbs>
          {currentSelection && (
            <ul className="settings-breadcrumbs">
              <li>{currentSelection.addon?.name}</li>
              {(currentSelection?.path || []).map((breadcrumb, index) => (
                <li key={index}>{breadcrumb}</li>
              ))}
            </ul>
          )}
        </Breadcrumbs>

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
    <Splitter layout="horizontal" style={{ width: '100%', height: '100%' }}>
      <SplitterPanel size={80} style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
        <Section style={{ maxWidth: 400 }}>
          {addonListHeader}
          <AddonList
            projectKey={projectKey}
            selectedAddons={selectedAddons}
            setSelectedAddons={setSelectedAddons}
            changedAddons={Object.keys(localData) /* Unused, AddonList doesn't have project&site */}
            environment={environment}
            showAllAddons={showAllAddons}
            onAddonChanged={onAddonChanged}
            projectName={projectName}
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
              style={{ flexGrow: 1, minWidth: 750 }}
              scrollStyle={{ padding: 0, backgroundColor: 'transparent' }}
            >
              {selectedAddons
                .filter((addon) => addon.version)
                .reverse()
                .map((addon) => {
                  const sites = showSites ? (selectedSites.length ? selectedSites : []) : ['_']

                  return sites.map((siteId) => {
                    const key = `${addon.name}|${addon.version}|${siteId}|${projectKey}`
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
                            onSettingsChange(addon.name, addon.version, siteId, data)
                          }
                          onLoad={(data) => onSettingsLoad(addon.name, addon.version, siteId, data)}
                          onSetChangedKeys={(data) =>
                            onSetChangedKeys(addon.name, addon.version, siteId, data)
                          }
                          localData={localData[key]}
                          changedKeys={localOverrides[key]}
                          reloadTrigger={reloadTrigger[key]}
                          currentSelection={currentSelection}
                          onSelect={setCurrentSelection}
                          projectName={projectName}
                          siteId={siteId === '_' ? null : siteId}
                          environment={environment}
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
          <Toolbar>
            <Spacer />
            <Button label="Dismiss all changes" icon="refresh" onClick={onRevertAllChanges} />
            <Button label="Save changes" icon="check" onClick={onSave} />
          </Toolbar>
          <SettingsChangesTable changes={localOverrides} onRevert={onRevertChange} />
        </Section>
      </SplitterPanel>
    </Splitter>
  )
}

export default AddonSettings
