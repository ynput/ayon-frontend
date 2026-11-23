import { useState, useMemo, useRef } from 'react'
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

import { usePromoteBundleMutation } from '@shared/api'
import { useListBundlesQuery } from '@shared/api'
import { confirmDialog } from 'primereact/confirmdialog'

import { getValueByPath, setValueByPath, sameKeysStructure, compareObjects } from './utils'
import arrayEquals from '@helpers/arrayEquals'
import { cloneDeep } from 'lodash'
import { usePaste } from '@context'
import styled from 'styled-components'

import SettingsListHeader from './SettingsListHeader'
import EmptyPlaceholder from '@shared/components/EmptyPlaceholder'
import ayonClient from '@/ayon'
import { attachLabels } from './searchTools'
import useUserProjectPermissions from '@hooks/useUserProjectPermissions'
import LoadingPage from '@pages/LoadingPage'
import PerProjectBundleConfig, {
  FROZEN_BUNDLE_ICON,
} from '../../components/PerProjectBundleConfig/PerProjectBundleConfig'
import { projectBundleFromName } from '../../components/PerProjectBundleConfig/PerProjectBundleConfigHelpers'
import { useSessionStorage, readSessionStorage, writeSessionStorage } from '@shared/hooks'
import { SETTINGS_VARIANT_KEY } from './settingsVariant'
import { InfoMessage } from '@shared/components'
import { AddonSettingsHistory, useAddonSettingsHistory } from './AddonSettingsHistory'

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
  const isDeveloper = user?.data?.isDeveloper
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

  // kept per browser tab; toggling developer mode sets it (setSettingsVariantForDeveloperMode)
  const [storedBundle, setSelectedBundle] = useSessionStorage(SETTINGS_VARIANT_KEY, {
    variant: developerMode ? 'dev' : 'production',
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

  // 'dev' is the user's dev bundle; a dev bundle falls back to production for non-developers
  const selectedBundle = useMemo(() => {
    const production = { variant: 'production', bundleName: null, projectBundleName: undefined }
    if (!isDeveloper && !['production', 'staging'].includes(storedBundle.variant)) {
      return production
    }
    if (storedBundle.variant === 'dev') {
      const devBundle = devBundles[0]
      return devBundle
        ? { variant: devBundle.name, bundleName: devBundle.name, projectBundleName: undefined }
        : production
    }
    return storedBundle
  }, [storedBundle, devBundles, isDeveloper])

  const shownAddons = useMemo(
    () => selectedAddons.filter((addon) => !addon.isBroken).reverse(),
    [selectedAddons],
  )
  // site settings have no history
  const histories = useAddonSettingsHistory(showSites, shownAddons.length > 0)

  // what the history reads and changes of the editor, through functions that never change
  const editor = useRef(null)
  const settingMenus = useRef(new Set())
  const [historyActions] = useState(() => {
    const keyOf = (addonName) => {
      const addon = editor.current.addons.find((a) => a.name === addonName)
      return (
        addon && `${addon.name}|${addon.version}|${addon.variant}|_|${editor.current.projectKey}`
      )
    }
    // the editor keeps no entry for an addon without changes
    const setFor = (key, value) => (state) => {
      const next = { ...state, [key]: value }
      if (!value.length) delete next[key]
      return next
    }
    return {
      focusSetting: (addonName, path) => {
        const addon = editor.current.addons.find((a) => a.name === addonName)
        if (!addon) return
        setCurrentSelection({
          addonName,
          addonVersion: addon.version,
          addonString: `${addonName}@${addon.version}`,
          path,
          fieldId: ['root', ...path].join('_'),
        })
      },
      getChanges: (addonName) => {
        const key = keyOf(addonName)
        const { localData, changedKeys, unpinnedKeys } = editor.current
        return {
          data: key ? localData[key] : undefined,
          changed: (key && changedKeys[key]) || [],
          unpinned: (key && unpinnedKeys[key]) || [],
        }
      },
      setChanges: (addonName, { data, changed, unpinned }) => {
        const key = keyOf(addonName)
        if (!key) return
        setLocalData((localData) => ({ ...localData, [key]: data }))
        setChangedKeys(setFor(key, changed))
        setUnpinnedKeys(setFor(key, unpinned))
      },
      revertChange: (addonName, path) => {
        const key = keyOf(addonName)
        if (key) editor.current.onRevertChange({ [key]: [path] })
      },
      formSelector: (addonName) => `[data-addon-settings="${CSS.escape(addonName)}"]`,
      addSettingMenu: (menu) => {
        settingMenus.current.add(menu)
        return () => settingMenus.current.delete(menu)
      },
    }
  })
  // an addon's broken menu leaves the editor's own items
  const getSettingMenuItems = (addonName, path) =>
    [...settingMenus.current].flatMap((menu) => {
      try {
        return menu(addonName, path)
      } catch (error) {
        console.error(error)
        return []
      }
    })

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
      } catch (error) {
        allOk = false
        const e = error?.data || error
        toast.error(
          <>
            <strong>Unable to save {variant} settings</strong>
            <br />
            {addonName} {addonVersion}
            <br />
            {e.detail}
            {e.errors?.length > 0 && (
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
    if (!e.data?.name) return
    const isSelected = selectedAddons.some((addon) => addon.name === e.data.name)
    const targetAddons = isSelected ? selectedAddons : [e.data]
    // the dialogs act on the selected addons, so an action selects a right-clicked addon first
    const withSelection = (open) => () => {
      if (!isSelected) onSelectAddon(targetAddons)
      open()
    }
    const menuItems = [
      {
        label: 'Copy settings from...',
        command: withSelection(() => setShowCopySettings(true)),
      },
    ]
    if (user?.data?.isAdmin) {
      menuItems.push({
        label: 'Low-level editor',
        command: withSelection(() => setShowRawEdit(true)),
        disabled: targetAddons.length !== 1,
      })
    }
    addonListContextMenu(e.originalEvent, menuItems)
  }

  //
  // RENDER
  //

  const canCommit = useMemo(() => Object.keys(changedKeys).length > 0, [changedKeys])

  editor.current = {
    addons: shownAddons,
    projectKey,
    localData,
    changedKeys,
    unpinnedKeys,
    onRevertChange,
  }
  const historyAddons = useMemo(
    () =>
      shownAddons.map(({ name, version, variant, title }) => ({
        name,
        version,
        variant,
        title: title || name,
      })),
    [shownAddons],
  )
  const selectedAddonName = currentSelection?.path?.length
    ? currentSelection.addonString.split('@')[0]
    : null
  const selectedSetting = useMemo(
    () => selectedAddonName && { addonName: selectedAddonName, path: currentSelection.path },
    [selectedAddonName, currentSelection?.path],
  )
  // a new object only when the paths change: the editor replaces changedKeys on every edit
  const changedPathsJson = JSON.stringify(
    Object.fromEntries(
      shownAddons
        .map((addon) => [
          addon.name,
          changedKeys[`${addon.name}|${addon.version}|${addon.variant}|_|${projectKey}`],
        ])
        .filter(([, paths]) => paths?.length),
    ),
  )
  const changedPaths = useMemo(() => JSON.parse(changedPathsJson), [changedPathsJson])
  const historyContext = useMemo(
    () => ({
      ...historyActions,
      addons: historyAddons,
      projectName: projectName || null,
      schemas: addonSchemas,
      selected: selectedSetting,
      hasChanges: canCommit,
      changedPaths,
    }),
    [
      historyActions,
      historyAddons,
      projectName,
      addonSchemas,
      selectedSetting,
      canCommit,
      changedPaths,
    ],
  )

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
          label="Clear"
          icon="clear"
          onClick={onRevertAllChanges}
          disabled={!canCommit}
          data-tooltip="Clear all changes"
          style={{ flexShrink: 0 }}
        />
        <SaveButton
          label="Save changes"
          style={{ flexShrink: 0 }}
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
    // Open the root section of a newly picked addon, so its settings show without another click.
    // The root panel id is the same for every addon.
    if (newSelection.some((a) => !selectedAddons.find((s) => s.name === a.name))) {
      const expanded = readSessionStorage('expanded-settings-keys', [])
      if (!expanded.includes('root'))
        writeSessionStorage('expanded-settings-keys', [...expanded, 'root'])
    }
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
        <Section className="standard-rows" style={{ maxWidth: 400, minWidth: 400 }}>
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
          <AddonSettingsHistory histories={histories} piece="timeline" context={historyContext} />
          <Section style={{ position: 'relative' }}>
            {showSites && !ayonClient.settings.sites.length ? (
              <EmptyPlaceholder
                className="muted"
                style={{ zIndex: 1 }}
                icon="computer"
                message="Site settings become available once a launcher registers a site"
              />
            ) : !selectedAddons.some((addon) => !addon.isBroken) ? (
              <EmptyPlaceholder
                style={{ zIndex: 1 }}
                icon={selectedAddons.length ? 'error' : 'settings'}
                message={
                  selectedAddons.length
                    ? 'Settings could not be loaded'
                    : 'Select an addon to edit its settings'
                }
              />
            ) : (
              showSites &&
              !selectedSites.length && (
                <EmptyPlaceholder
                  style={{ zIndex: 1 }}
                  icon="computer"
                  message="Select a site to edit its settings"
                />
              )
            )}
            <StyledScrollPanel className="nopad" style={{ flexGrow: 1 }} id="settings-scroll-panel">
              {shownAddons.map((addon) => {
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
                      data-addon-settings={addon.name}
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
                          updateChangedKeys(addon.name, addon.version, addon.variant, siteId, data)
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
                          getSettingMenuItems: (path) => getSettingMenuItems(addon.name, path),
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
      <SplitterPanel size={20} style={{ minWidth: 240 }}>
        <Section wrap>
          <Toolbar>{commitToolbar}</Toolbar>
          <AddonSettingsHistory histories={histories} piece="sidebar" context={historyContext} />
          {/* the history takes the place of the unsaved changes while there are none */}
          {(canCommit || !histories.length) && (
            <SettingsChangesTable
              changes={changedKeys}
              unpins={unpinnedKeys}
              onRevert={onRevertChange}
            />
          )}
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
