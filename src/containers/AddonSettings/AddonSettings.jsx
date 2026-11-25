import { useState, useMemo, useCallback, startTransition } from 'react'
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
import { AddonSettingsSheets } from './AddonSettingsSheets'
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
} from '@queries/addonSettings'

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
import { useFlatSettingsLayout } from '@hooks/useFlatSettingsLayout'
import LoadingPage from '@pages/LoadingPage'
import PerProjectBundleConfig, {
  FROZEN_BUNDLE_ICON,
} from '../../components/PerProjectBundleConfig/PerProjectBundleConfig'
import { projectBundleFromName } from '../../components/PerProjectBundleConfig/PerProjectBundleConfigHelpers'
import { useSessionStorage, readSessionStorage, writeSessionStorage } from '@shared/hooks'
import { SETTINGS_VARIANT_KEY } from './settingsVariant'
import { InfoMessage } from '@shared/components'

/*
 * key is {addonName}|{addonVersion}|{variant}|{siteId}|{projectKey}
 * if project name or siteid is N/a, use _ instead
 */

const StyledScrollPanel = styled(ScrollPanel)`
  > div {
    padding-right: 8px;

    /* the flat sheet has even margins of its own: the scrollbar is the only thing on its right */
    &:has(.settings-flat) {
      padding-right: 0;
    }
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
  const developerMode = user?.attrib?.developerMode
  const isDeveloper = user?.data?.isDeveloper
  const userName = useSelector((state) => state.user.name)
  const flatLayout = useFlatSettingsLayout()

  const [showHelp, setShowHelp] = useState(false)
  const [selectedAddons, setSelectedAddons] = useState([])
  const [originalData, setOriginalData] = useState({})
  const [localData, setLocalData] = useState({})
  const [changedKeys, setChangedKeys] = useState({})
  const [unpinnedKeys, setUnpinnedKeys] = useState({})
  const [currentSelection, setCurrentSelection] = useState(null)
  const [selectedSites, setSelectedSites] = useState([])

  const siteId = showSites ? selectedSites[0] || '_' : undefined

  const { data: { bundles = [] } = {}, isLoading: bundlesLoading } = useListBundlesQuery({
    archived: false,
  })

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

  // the dev bundle is only known once the bundles load: until then the addon list waits,
  // rather than loading production's whole settings payload for nothing
  const waitingForBundle = bundlesLoading && developerMode && storedBundle.variant === 'dev'

  // the saved settings, kept current: after a save the panel loads them again, and changes
  // (raw settings, revert) are worked out against them, not the first load
  const onSettingsLoad = useCallback(
    (addon, siteId, data) => {
      const key = `${addon.name}|${addon.version}|${addon.variant}|${siteId}|${projectKey}`
      setOriginalData((currentData) =>
        currentData[key] === data ? currentData : { ...currentData, [key]: data },
      )
    },
    [projectKey],
  )

  const onSettingsChange = useCallback(
    (addon, siteId, data) => {
      const key = `${addon.name}|${addon.version}|${addon.variant}|${siteId}|${projectKey}`
      setLocalData((currentData) => ({ ...currentData, [key]: data }))
    },
    [projectKey],
  )

  const updateChangedKeys = useCallback(
    (addon, siteId, data) => {
      // data is a list of [{path:list, isChanged: bool}]

      if (data.length === 0) return
      if (data.length === 1 && !data[0].path?.length) return

      setChangedKeys((changedKeys) => {
        const key = `${addon.name}|${addon.version}|${addon.variant}|${siteId}|${projectKey}`
        const keyData = [...(changedKeys[key] || [])]

        for (const item of data) {
          const index = keyData.findIndex((keyItem) => arrayEquals(keyItem, item.path))
          if (index === -1 && item.isChanged) {
            keyData.push(item.path)
          } else if (index > -1 && !item.isChanged) {
            keyData.splice(index, 1)
          }
        }

        if (!keyData.length) {
          const nextChangedKeys = { ...changedKeys }
          delete nextChangedKeys[key]
          return nextChangedKeys
        }

        return { ...changedKeys, [key]: keyData }
      })
    },
    [projectKey],
  )

  const reloadAddons = useCallback((keys) => {
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
  }, [])

  const onSave = useCallback(async () => {
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
  }, [
    changedKeys,
    localData,
    unpinnedKeys,
    setAddonSettings,
    reloadAddons,
    setChangedKeys,
    setUnpinnedKeys,
  ])

  const onRevertAllChanges = useCallback(() => {
    const keys = Object.keys(changedKeys)
    setChangedKeys({})
    setUnpinnedKeys({})
    reloadAddons(keys)
  }, [changedKeys, reloadAddons])

  const onRevertChange = (keysToRevert) => {
    // keys to revert is a dict {addonKey: [ [path, to, change1], [path, to, change2] ]}
    for (const addonKey in keysToRevert) {
      for (const path of keysToRevert[addonKey]) {
        setLocalData((localData) => {
          const returnValue = getValueByPath(originalData[addonKey], path)
          console.log('REVERT ', path, 'TO', returnValue)
          try {
            const nextLocalData = { ...localData }
            nextLocalData[addonKey] = setValueByPath(
              cloneDeep(localData[addonKey]),
              path,
              returnValue,
            )
            return nextLocalData
          } catch (error) {
            console.error(error)
            return localData
          }
        }) // setLocalData
        setChangedKeys((changedKeys) => {
          const addonChanges = (changedKeys[addonKey] || []).filter(
            (changedPath) => !isChildPath(changedPath, path),
          )

          if (!addonChanges.length) {
            const nextChangedKeys = { ...changedKeys }
            delete nextChangedKeys[addonKey]
            return nextChangedKeys
          }

          return { ...changedKeys, [addonKey]: addonChanges }
        }) // setChangedKeys

        setUnpinnedKeys((unpinnedKeys) => {
          const addonChanges = (unpinnedKeys[addonKey] || []).filter(
            (changedPath) => !isChildPath(changedPath, path),
          )

          if (!addonChanges.length) {
            const nextUnpinnedKeys = { ...unpinnedKeys }
            delete nextUnpinnedKeys[addonKey]
            return nextUnpinnedKeys
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
      } catch {
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
      } catch {
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
      } catch {
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

  // Sets a value at a path of an addon's settings: a pasted one, or one edited as JSON
  // (`verb` names that in the messages). Validates that it is compatible with the value there.
  // Returns whether it was set: the JSON dialog stays open when it wasn't
  const pushValueToPath = (addon, siteId, path, value, verb = 'paste') => {
    const key = `${addon.name}|${addon.version}|${addon.variant}|${siteId || '_'}|${
      projectKey || '_'
    }`
    const allData = localData[key]
    if (!allData) {
      toast.error(`No data to ${verb}`)
      return false
    }
    const oldValue = path.length === 0 ? allData : getValueByPath(allData, path)
    if (oldValue === undefined) {
      toast.error(`No data to ${verb}`)
      return false
    }

    if (!sameKeysStructure(oldValue, value)) {
      toast.error('Incompatible data structure')
      return false
    }

    let newData = { ...localData }

    let currentAddonData = cloneDeep(localData[key])
    if (path.length === 0) {
      newData[key] = value
    } else {
      newData[key] = setValueByPath(currentAddonData, path, value)
    }

    // under the path, the changed keys are worked out again against the saved settings, so a
    // value set back to what is saved is no longer a change. The addon's other changes stay
    const isUnderPath = (keyPath) =>
      keyPath.length >= path.length &&
      path.every((part, index) => String(keyPath[index]) === String(part))
    const kept = (changedKeys[key] || []).filter((keyPath) => !isUnderPath(keyPath))
    const changed = compareObjects(originalData[key] || {}, newData[key]).filter(isUnderPath)

    setChangedKeys({ ...changedKeys, [key]: [...kept, ...changed] })
    setLocalData(newData)
    return true
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
    } catch {
      toast.error('Invalid JSON')
      return
    }
    pushValueToPath(addon, siteId, path, value)
  } // paste

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
  // the project's settings are read-only for users without edit permissions (site settings are
  // each user's own)
  const canEditSettings = bypassPermissions || userPermissions.canEditSettings(projectName)

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
  }, [
    selectedBundle,
    setSelectedBundle,
    changedKeys,
    canCommit,
    loadedBundleName,
    projectName,
    showSites,
    localData,
    unpinnedKeys,
    setLocalData,
    setChangedKeys,
    setUnpinnedKeys,
    setSelectedAddons,
    originalData,
    setOriginalData,
  ])

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
          disabled={!canEditSettings || !canCommit}
          data-tooltip={canEditSettings ? undefined : "You don't have edit permissions"}
          onClick={onSave}
          active={canCommit}
          saving={setAddonSettingsUpdating}
        />
      </>
    ),
    [onRevertAllChanges, onSave, canCommit, canEditSettings, setAddonSettingsUpdating],
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

  const onUpdateAddonSchema = useCallback(
    (addonName, schema) => {
      // TODO: Rewrite this to not rely on `settings` in addon settings list
      // as it requires addon list to load the entire payload, which is not optimal
      const addon = selectedAddons.find((el) => el.name === addonName)
      if (!addon) return
      const hydratedObject = attachLabels(addon.settings, schema, schema)
      setSearchTree((prev) => ({
        ...prev,
        [addonName]: hydratedObject,
      }))
      setAddonSchemas((prev) => ({
        ...prev,
        [addonName]: schema,
      }))
    },
    [selectedAddons],
  )

  // re-rendering the forms is a transition: typing and clicks stay responsive meanwhile
  const onSearchSettings = useCallback((searchText, filterKeys) => {
    startTransition(() => {
      if (searchText === undefined) {
        setSearchText('')
        setFilterKeys([])
        return
      }

      setSearchText(searchText)
      setFilterKeys(filterKeys)
    })
  }, [])

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
            waiting={waitingForBundle}
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
            searchCallback={onSearchSettings}
          />
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
              <AddonSettingsSheets flat={flatLayout}>
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
                            onChange={onSettingsChange}
                            onLoad={onSettingsLoad}
                            onSetChangedKeys={updateChangedKeys}
                            localData={localData[key]}
                            changedKeys={changedKeys[key]}
                            currentSelection={currentSelection}
                            onSelect={setCurrentSelection}
                            projectName={projectName}
                            includeStudioScope={addon.isProjectBundle}
                            siteId={siteId === '_' ? null : siteId}
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
                              onSetRawValue: (path, value) =>
                                pushValueToPath(addon, siteId, path, value, 'update'),
                              includeStudioScope: !!addon.isProjectBundle,
                              // read-only users can look, not change (raw settings, Paste)
                              readOnly: !canEditSettings,
                            }}
                          />
                        </Panel>
                      )
                    })
                  })}
              </AddonSettingsSheets>

              <Spacer />
            </StyledScrollPanel>
          </Section>
        </Section>
      </SplitterPanel>
      <SplitterPanel size={20} style={{ minWidth: 240 }}>
        <Section wrap>
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
