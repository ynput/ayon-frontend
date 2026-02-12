import { useState, useMemo, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'

import { useCreateContextMenu } from '@shared/containers/ContextMenu'

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

import SettingsAddonList from '@containers/AddonSettings/SettingsAddonList'
import SiteList from '@containers/SiteList'
import AddonSettingsPanel from './AddonSettingsPanel'
import SettingsChangesTable from './SettingsChangesTable'
import CopyBundleSettingsButton from './CopyBundleSettingsButton'
import VariantSelector from './VariantSelector'
import BundlesSelector from './BundlesSelector'
import CopySettingsDialog from '@containers/CopySettings/CopySettingsDialog'
import RawSettingsDialog from '@containers/RawSettingsDialog'

import {
  useSetAddonSettingsMutation,
  useDeleteAddonSettingsMutation,
  useModifyAddonOverrideMutation,
  useGetAddonSettingsListQuery,
} from '@queries/addonSettings'

import { usePromoteBundleMutation } from '@queries/bundles/updateBundles'
import { useListBundlesQuery } from '@queries/bundles/getBundles'
import { confirmDialog } from 'primereact/confirmdialog'

import { getValueByPath, setValueByPath, sameKeysStructure, compareObjects } from './utils'
import arrayEquals from '@helpers/arrayEquals'
import { cloneDeep } from 'lodash'
import { usePaste } from '@context/PasteContext'
import styled from 'styled-components'

import SettingsListHeader from './SettingsListHeader'
import EmptyPlaceholder from '@shared/components/EmptyPlaceholder'
import { attachLabels } from './searchTools'
import useUserProjectPermissions from '@hooks/useUserProjectPermissions'
import LoadingPage from '@pages/LoadingPage'
import PerProjectBundleConfig, {
  FROZEN_BUNDLE_ICON,
  projectBundleFromName,
} from '../../components/PerProjectBundleConfig/PerProjectBundleConfig'
import { useLocalStorage } from '@shared/hooks'
import InfoMessage from '@components/InfoMessage'

/*
 * key is {addonName}|{addonVersion}|{variant}|{siteId}|{projectKey}
 * if project name or siteid is N/a, use _ instead
 */

const StyledScrollPanel = styled(ScrollPanel)`
  > div {
    padding-right: 8px;
  }
`

const StyledEmptyPlaceholder = styled(EmptyPlaceholder)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  widows: 100%;
`

const StyledBundleLabel = styled.div`
  padding: 6px var(--padding-m);
  background-color: var(--md-sys-color-surface-container-low);
  border-radius: var(--border-radius-m);
  width: 100%;
  display: flex;
  align-items: center;

  .label {
    font-style: italic;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 100%;
    flex: 1;
    color: var(--md-sys-color-outline);
  }
`

const isChildPath = (childPath, parentPath) => {
  if (childPath.length < parentPath.length) return false
  for (let i = 0; i < parentPath.length; i++) {
    if (childPath[i] !== parentPath[i]) return false
  }
  return true
}

const AddonSettings = ({ projectName, showSites = false, bypassPermissions = false }) => {
  const isUser = useSelector((state) => state.user.data.isUser)
  //const navigate = useNavigate()
  const user = useSelector((state) => state.user)
  const developerMode = useMemo(() => user?.attrib?.developerMode, [JSON.stringify(user?.attrib)])
  const userName = useSelector((state) => state.user.name)

  const [showHelp, setShowHelp] = useState(false)
  const [selectedAddons, setSelectedAddons] = useState([])
  const [originalData, setOriginalData] = useState({})
  const [localData, setLocalData] = useState({})
  const [changedKeys, setChangedKeys] = useState({})
  const [unpinnedKeys, setUnpinnedKeys] = useState({})
  const [currentSelection, setCurrentSelection] = useState(null)
  const [selectedSites, setSelectedSites] = useState([])

  const siteId = showSites ? selectedSites[0] || '_' : undefined

  const { data: { bundles = [] } = {} } = useListBundlesQuery({ archived: false })

  const [selectedBundle, setSelectedBundle] = useLocalStorage('variant-type', {
    variant: 'production',
    bundleName: null,
    projectBundleName: undefined,
  })

  const [loadedBundleName, setLoadedBundleName] = useState('????')

  const [addonSchemas, setAddonSchemas] = useState({})

  const [showCopySettings, setShowCopySettings] = useState(false)
  const [showRawEdit, setShowRawEdit] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [filterKeys, setFilterKeys] = useState([])
  const [searchTree, setSearchTree] = useState([])

  const [setAddonSettings, { isLoading: setAddonSettingsUpdating }] = useSetAddonSettingsMutation()
  const [deleteAddonSettings] = useDeleteAddonSettingsMutation()
  const [modifyAddonOverride] = useModifyAddonOverrideMutation()
  const [promoteBundle] = usePromoteBundleMutation()
  const { requestPaste } = usePaste()

  const { isLoading, permissions: userPermissions } = useUserProjectPermissions(isUser)

  const projectKey = projectName || '_'

  const onAddonFocus = ({ addonName, addonVersion, siteId, path }) => {
    if (!path?.length) {
      setCurrentSelection(null)
      return
    }

    const fieldId = path.length ? `root_${path.join('_')}` : 'root'
    const addonString = `${addonName}@${addonVersion}`

    setCurrentSelection({
      addonName,
      addonVersion,
      addonString,
      siteId,
      path,
      fieldId,
    })
  }

  const devBundles = useMemo(() => {
    return bundles.filter((bundle) => bundle.isDev && bundle.activeUser === userName)
  }, [bundles, userName])

  // Update selectedBundle when developer mode changes
  useEffect(() => {
    if (developerMode) {
      // Switch to dev bundle when entering developer mode
      const devBundle = devBundles.find((bundle) => bundle.isDev && bundle.activeUser === userName)
      if (devBundle) {
        setSelectedBundle({
          variant: devBundle.name,
          bundleName: devBundle.name,
          projectBundleName: undefined,
        })
      }
      // If no dev bundle found, stay on current variant (don't switch)
    } else {
      // Switch back to production when leaving developer mode
      setSelectedBundle({
        variant: 'production',
        bundleName: null,
        projectBundleName: undefined,
      })
    }
  }, [developerMode, JSON.stringify(devBundles), userName])

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

  const onSave = async () => {
    let updatedKeys = []
    let allOk = true

    for (const key in changedKeys) {
      if (!changedKeys[key]?.length) continue
      const [addonName, addonVersion, variant, siteId, projectName] = key.split('|')

      const payloadData = {
        ...localData[key],
        __pinned_fields__: changedKeys[key],
        __unpinned_fields__: unpinnedKeys[key] || [],
      }

      try {
        const payload = {
          addonName,
          addonVersion,
          projectName,
          siteId,
          variant,
          data: payloadData,
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

    setUnpinnedKeys({})

    reloadAddons(updatedKeys)

    if (allOk) {
      toast.success('Settings saved')
    }
  } // onSave

  const onRevertAllChanges = () => {
    const keys = Object.keys(changedKeys)
    setChangedKeys({})
    setUnpinnedKeys({})
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

        setUnpinnedKeys((unpinnedKeys) => {
          const addonChanges = unpinnedKeys[addonKey] || []
          // delete the path from the list of changed keys
          // also delete all children of this path

          for (const index in addonChanges) {
            if (isChildPath(addonChanges[index], path)) {
              addonChanges.splice(index, 1)
            }
          }

          if (!addonChanges.length) {
            delete unpinnedKeys[addonKey]
            return { ...unpinnedKeys }
          }

          return { ...unpinnedKeys, [addonKey]: addonChanges }
        }) // setUnpinnedKeys
      }
    }
  }

  //
  // Context menu actions
  //

  const onRemoveOverride = async (addon, siteId, path) => {
    // Remove a single override for this addon (within current project and variant)
    // path is an array of strings

    // TODO: Use this to staged unpin.
    // It is not used now because we don't have an information about the original value
    //
    // const key = `${addon.name}|${addon.version}|${addon.variant}|${siteId || '_'}|${projectKey}`
    //
    // setChangedKeys((changedKeys) => {
    //   const keyData = changedKeys[key] || []
    //
    //   const index = keyData.findIndex((keyItem) => arrayEquals(keyItem, path))
    //   if (index === -1) {
    //     keyData.push(path)
    //   }
    //   return { ...changedKeys, [key]: keyData }
    // })
    //
    // setUnpinnedKeys((unpinnedKeys) => {
    //   const keyData = unpinnedKeys[key] || []
    //
    //   const index = keyData.findIndex((keyItem) => arrayEquals(keyItem, path))
    //   if (index === -1) {
    //     keyData.push(path)
    //   }
    //
    //   return { ...unpinnedKeys, [key]: keyData }
    // })
    //

    const message = (
      <>
        <p>This action will instantly remove the selected override.</p>
        <p>Are you sure you want to continue?</p>
      </>
    )

    const executeRemove = async () => {
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
      reloadAddons([
        `${addon.name}|${addon.version}|${addon.variant}|${siteId || '_'}|${projectKey}`,
      ])
    }

    confirmDialog({
      header: 'Remove selected override',
      message,
      accept: executeRemove,
      reject: () => {},
    })
  }

  const onRemoveAllOverrides = async (addon, siteId) => {
    // Remove all overrides for this addon (within current project and variant)
    const message = (
      <>
        <p>This action will instantly remove all overrides for this addon.</p>
        <p>Are you sure you want to proceed?</p>
      </>
    )

    const executeRemove = async () => {
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
      reloadAddons([
        `${addon.name}|${addon.version}|${addon.variant}|${siteId || '_'}|${projectKey}`,
      ])
    }

    confirmDialog({
      header: 'Remove all overrides',
      message,
      accept: executeRemove,
      reject: () => {},
    })
  }

  const onPinOverride = async (addon, siteId, path) => {
    const message = (
      <>
        <p>This action will instantly pin the current value as an override. </p>
        <p>Are you sure you want to proceed?</p>
      </>
    )

    const executePin = async () => {
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
      reloadAddons([
        `${addon.name}|${addon.version}|${addon.variant}|${siteId || '_'}|${projectKey}`,
      ])
    }

    confirmDialog({
      header: 'Pin override',
      message,
      accept: executePin,
      reject: () => {},
    })
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
    const oldValue = path.length === 0 ? allData : getValueByPath(allData, path)
    if (oldValue === undefined) {
      toast.error('No data to paste')
      return
    }

    if (!sameKeysStructure(oldValue, value)) {
      toast.error('Incompatible data structure')
      // console.log('Old value', oldValue)
      // console.log('New value', value)
      return
    }

    let newData = { ...localData }

    let currentAddonData = cloneDeep(localData[key])
    if (path.length === 0) {
      newData[key] = value
    } else {
      newData[key] = setValueByPath(currentAddonData, path, value)
    }

    const newChangedKeys = { ...changedKeys }
    const no = compareObjects(localData[key], newData[key])
    newChangedKeys[key] = no

    setChangedKeys(newChangedKeys)
    setLocalData(newData)
  }

  const onPasteValue = async (addon, siteId, path) => {
    const pastedContent = await requestPaste()
    if (!pastedContent) {
      toast.error('No content to paste')
      return
    }
    let value
    try {
      value = JSON.parse(pastedContent)
    } catch (e) {
      toast.error('Invalid JSON')
      return
    }
    pushValueToPath(addon, siteId, path, value)
  } // paste

  const onPushToProduction = async () => {
    // Push the current bundle to production

    const message = (
      <>
        <p>
          Are you sure you want to push <strong>{loadedBundleName}</strong> to production?
        </p>
        <p>
          This will mark the current staging bundle as production and copy all staging studio
          settings and staging projects overrides to production as well.
        </p>
      </>
    )

    confirmDialog({
      header: `Push ${loadedBundleName} to production`,
      message,
      accept: async () => {
        await promoteBundle({ name: loadedBundleName }).unwrap()
        setLocalData({})
        setOriginalData({})
        setSelectedAddons([])
        toast.success('Bundle pushed to production')
        setSelectedBundle({ variant: 'production', bundleName: null })
      },
      reject: () => {},
    })
  }

  // Addon list context menu

  const [addonListContextMenu] = useCreateContextMenu([])
  const showAddonListContextMenu = (e) => {
    setTimeout(() => {
      const menuItems = [
        {
          label: 'Copy settings from...',
          command: () => setShowCopySettings(true),
        },
      ]
      if (user?.data?.isAdmin) {
        menuItems.push({
          label: 'Low-level editor',
          command: () => setShowRawEdit(true),
          disabled: selectedAddons.length !== 1,
        })
      }
      addonListContextMenu(e.originalEvent, menuItems)
    }, 50)
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
          <VariantSelector
            variant={selectedBundle.variant}
            setVariant={(v) => setSelectedBundle({ variant: v, bundleName: null })}
            showDev
          />
          <Spacer />
          {projectName && (
            <PerProjectBundleConfig
              projectName={projectName}
              variant={selectedBundle.variant}
              isPerProjectBundle={!!projectBundleFromName(loadedBundleName)}
            />
          )}
          <CopyBundleSettingsButton
            bundleName={loadedBundleName}
            variant={selectedBundle.variant}
            disabled={canCommit}
            localData={localData}
            changedKeys={changedKeys}
            unpinnedKeys={unpinnedKeys}
            setLocalData={setLocalData}
            setChangedKeys={setChangedKeys}
            setUnpinnedKeys={setUnpinnedKeys}
            setSelectedAddons={setSelectedAddons}
            originalData={originalData}
            setOriginalData={setOriginalData}
            projectName={projectName}
          />
        </Toolbar>
        {projectName ? (
          <BundlesSelector selected={{ projectBundleName: loadedBundleName }} disabled />
        ) : (
          <BundlesSelector selected={selectedBundle} onChange={setSelectedBundle} />
        )}
      </>
    )
  }, [selectedBundle, changedKeys, loadedBundleName, projectName, developerMode])

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
          disabled={
            (!bypassPermissions && !userPermissions.canEditSettings(projectName)) || !canCommit
          }
          data-tooltip={
            !bypassPermissions && !userPermissions.canEditSettings(projectName)
              ? "You don't have edit permissions"
              : undefined
          }
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

  const onUpdateAddonSchema = (addonName, schema) => {
    // TODO: Rewrite this to not rely on `settings` in addon settings list
    // as it requires addon list to load the entire payload, which is not optimal
    const settings = selectedAddons.find((el) => el.name == addonName).settings
    const hydratedObject = attachLabels(settings, schema, schema)
    setSearchTree((prev) => {
      return {
        ...prev,
        [addonName]: hydratedObject,
      }
    })
    setAddonSchemas((prev) => {
      return {
        ...prev,
        [addonName]: schema,
      }
    })
  }

  if (isLoading) {
    return <LoadingPage />
  }

  if (!bypassPermissions && !userPermissions.canViewSettings(projectName)) {
    return (
      <EmptyPlaceholder
        icon="settings_alert"
        message="You don't have permission to view the addon settings for this project"
      />
    )
  }

  return (
    <Splitter layout="horizontal" style={{ width: '100%', height: '100%' }}>
      <SplitterPanel size={80} style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
        <Section style={{ maxWidth: 400, minWidth: 400 }}>
          {addonListHeader}
          {showCopySettings && (
            <CopySettingsDialog
              selectedAddons={selectedAddons}
              variant={selectedBundle.variant}
              originalData={originalData}
              setOriginalData={setOriginalData}
              localData={localData}
              setLocalData={setLocalData}
              changedKeys={changedKeys}
              unpinnedKeys={unpinnedKeys}
              setChangedKeys={setChangedKeys}
              setUnpinnedKeys={setUnpinnedKeys}
              projectName={projectName}
              onClose={() => setShowCopySettings(false)}
            />
          )}
          {showRawEdit && (
            <RawSettingsDialog
              addonName={selectedAddons[0].name}
              addonVersion={selectedAddons[0].version}
              variant={selectedBundle.variant}
              reloadAddons={reloadAddons}
              projectName={projectName}
              siteId={siteId}
              onClose={() => {
                setShowRawEdit(false)
              }}
            />
          )}
          <SettingsAddonList
            selectedAddons={selectedAddons}
            setSelectedAddons={onSelectAddon}
            setBundleName={setLoadedBundleName}
            bundleName={selectedBundle.bundleName}
            projectBundleName={selectedBundle.projectBundleName}
            variant={selectedBundle.variant}
            onAddonFocus={onAddonFocus}
            changedAddonKeys={Object.keys(changedKeys || {})}
            projectName={projectName}
            siteSettings={showSites}
            onContextMenu={showAddonListContextMenu}
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
          <SettingsListHeader
            addonsData={selectedAddons || []}
            searchTreeData={searchTree}
            addonSchemas={addonSchemas || {}}
            showHelp={showHelp}
            setShowHelp={setShowHelp}
            projectName={projectName}
            searchCallback={(searchText, filterKeys) => {
              if (searchText === undefined) {
                setSearchText('')
                setFilterKeys([])
                return
              }

              setSearchText(searchText)
              setFilterKeys(filterKeys)
            }}
          />
          <Section>
            <StyledScrollPanel
              className="transparent nopad"
              style={{ flexGrow: 1 }}
              id="settings-scroll-panel"
            >
              {selectedAddons
                .filter((addon) => !addon.isBroken)
                .reverse()
                .map((addon) => {
                  const sites = showSites ? (selectedSites.length ? selectedSites : []) : ['_']

                  if (filterKeys.length === 0 && searchText !== '') {
                    return (
                      <StyledEmptyPlaceholder
                        key={addon.name}
                        icon="filter_list"
                        message="No settings found for the current search"
                      />
                    )
                  }
                  return sites.map((siteId) => {
                    const key = `${addon.name}|${addon.version}|${addon.variant}|${siteId}|${projectKey}`

                    return (
                      <Panel
                        key={key}
                        style={{ flexGrow: 0 }}
                        className="transparent nopad"
                        size={1}
                      >
                        {addon.isProjectBundle && (
                          <InfoMessage
                            message="The addon settings for this project are frozen to the project bundle.
                            Studio settings are also displayed alongside project-scoped settings."
                            icon={FROZEN_BUNDLE_ICON}
                          />
                        )}
                        <AddonSettingsPanel
                          addon={addon}
                          updateAddonSchema={onUpdateAddonSchema}
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
                          includeStudioScope={addon.isProjectBundle}
                          siteId={siteId === '_' ? null : siteId}
                          // Needed for rerender, component memoized
                          searchText={searchText}
                          filterKeys={filterKeys}
                          context={{
                            headerProjectName: projectName,
                            headerSiteId: siteId === '_' ? null : siteId,
                            headerVariant: addon.variant,
                            addonName: addon.name,
                            searchText,
                            filterKeys,
                            onRemoveOverride: (path) => onRemoveOverride(addon, siteId, path),
                            onPinOverride: (path) => onPinOverride(addon, siteId, path),
                            onRemoveAllOverrides: () => onRemoveAllOverrides(addon, siteId),
                            onPasteValue: (path) => onPasteValue(addon, siteId, path),
                            includeStudioScope: !!addon.isProjectBundle,
                          }}
                        />
                      </Panel>
                    )
                  })
                })}

              <Spacer />
            </StyledScrollPanel>
          </Section>
        </Section>
      </SplitterPanel>
      <SplitterPanel size={20}>
        <Section wrap style={{ minWidth: 300 }}>
          <Toolbar>{commitToolbar}</Toolbar>
          <SettingsChangesTable
            changes={changedKeys}
            unpins={unpinnedKeys}
            onRevert={onRevertChange}
          />
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
