import { useState, useMemo, useEffect } from 'react'
import BundleList from './BundleList'
import BundleDetail from './BundleDetail'

import { Button, InputSwitch, Section, Toolbar } from '@ynput/ayon-react-components'

import {
  useDeleteBundleMutation,
  useGetBundleListQuery,
  useUpdateBundleMutation,
} from '/src/services/bundles'
import getNewBundleName from './getNewBundleName'
import NewBundle from './NewBundle'
import { useGetInstallerListQuery } from '/src/services/installers'
import { useGetAddonListQuery } from '../../../services/addons/getAddons'
import { upperFirst } from 'lodash'
import { toast } from 'react-toastify'
import { Dialog } from 'primereact/dialog'
import AddonUpload from '../AddonInstall/AddonUpload'
import { useGetAddonSettingsQuery } from '/src/services/addonSettings'
import getLatestSemver from './getLatestSemver'
import { ayonApi } from '/src/services/ayon'
import { useDispatch } from 'react-redux'
import useServerRestart from '/src/hooks/useServerRestart'
import useLocalStorage from '/src/hooks/useLocalStorage'
import { useLocation } from 'react-router'

const Bundles = () => {
  const location = useLocation()
  const dispatch = useDispatch()
  // addon install dialog
  const [uploadOpen, setUploadOpen] = useState(false)

  // keep track is an addon was installed
  const [restartRequired, setRestartRequired] = useState(false)

  // table selection
  const [selectedBundles, setSelectedBundles] = useState([])

  // open bundle details
  // set a bundle name to open the new bundle form, plus add any extra data
  const [newBundleOpen, setNewBundleOpen] = useState(null)

  const [showArchived, setShowArchived] = useLocalStorage('bundles-archived', true)

  // REDUX QUERIES
  let { data: bundleList = [], isLoading } = useGetBundleListQuery({ archived: true })
  const { data: installerList = [], isLoading: isLoadingInstallers } = useGetInstallerListQuery()
  const { data: addons = [], isLoading: isLoadingAddons } = useGetAddonListQuery({
    showVersions: true,
  })

  // filter out archived bundles if showArchived is true
  bundleList = useMemo(() => {
    if (!showArchived) {
      return [...bundleList]
        .filter((bundle) => !bundle.isArchived)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }
    return bundleList
  }, [bundleList, showArchived])

  // if there is a url query ?selected={name} = latest then select the bundle and remove the query
  useEffect(() => {
    if (isLoading) return
    const search = new URLSearchParams(location.search)
    const selected = search.get('selected')
    // if selected = latest then select the latest bundle createdAt
    if (selected === 'latest') {
      const latest = bundleList[0]

      if (latest) {
        setSelectedBundles([latest.name])
      }
    } else if (selected) {
      // select bundle by name if in bundle list
      const bundle = bundleList.find((b) => b.name === selected)
      if (bundle) setSelectedBundles([selected])
    }

    // delete
    search.delete('selected')
    window.history.replaceState({}, '', `${location.pathname}${search.size ? '?' : ''}${search}`)
  }, [location.search, isLoading, bundleList])

  // REDUX MUTATIONS
  const [deleteBundle] = useDeleteBundleMutation()
  const [updateBundle] = useUpdateBundleMutation()

  // get latest core version
  const coreAddonLatestVersion = useMemo(() => {
    const coreAddonVersions = addons.find((addon) => addon.name === 'core')?.versions || {}
    return getLatestSemver(Object.keys(coreAddonVersions))
  }, [addons])

  // get core addon settings for version
  const { data: coreAddonSettings } = useGetAddonSettingsQuery(
    {
      addonName: 'core',
      addonVersion: coreAddonLatestVersion,
    },
    { skip: !coreAddonLatestVersion },
  )

  // get studio name from core addon settings
  const studioName = useMemo(() => {
    return coreAddonSettings?.studio_name
  }, [coreAddonSettings])

  const bundlesData = useMemo(() => {
    if (!(bundleList && selectedBundles.length)) {
      return []
    }
    const result = bundleList.filter((bundle) => selectedBundles.includes(bundle.name))

    return result
  }, [bundleList, selectedBundles])

  const installerVersions = useMemo(() => {
    if (!installerList) return []

    const r = {}
    for (const installer of installerList) {
      if (r[installer.version]) {
        r[installer.version].push(installer.platform)
      } else {
        r[installer.version] = [installer.platform]
      }
    }

    return Object.entries(r).map(([version, platforms]) => ({
      platforms,
      version,
    }))
  }, [installerList])

  const handleBundleSelect = (names) => {
    setSelectedBundles(names)
    setNewBundleOpen(null)
  }

  const handleNewBundleStart = () => {
    const name = getNewBundleName(studioName, bundleList)
    setNewBundleOpen({ name })
  }

  const handleNewBundleEnd = (name) => {
    setNewBundleOpen(null)
    setSelectedBundles([name])
  }

  const getVersionedName = (name) => {
    let newName
    const versionNumber = parseInt(name.split('-').pop())
    if (!isNaN(versionNumber)) {
      newName = name.replace(/(\d+)$/, () => {
        return (versionNumber + 1).toString().padStart(2, '0')
      })
    } else {
      newName = `${name}-01`
    }

    // if there is no xx at the end, add 01
    if (newName === name) {
      newName += '-01'
    }

    return newName
  }

  const handleDuplicateBundle = (name) => {
    // get the bundle data
    const bundle = bundleList.find((b) => b.name === name)
    if (!bundle) return

    let newName = getVersionedName(name)

    const bundleNames = bundleList.map((b) => b.name)
    // make sure the new name doesn't already exist
    while (bundleNames.includes(newName)) {
      newName = getVersionedName(newName)
    }

    setNewBundleOpen({
      name: newName,
      addons: bundle.addons,
      installerVersion: bundle.installerVersion,
      dependencyPackages: bundle.dependencyPackages,
      isArchived: false,
      isStaging: false,
      isProduction: false,
    })
    setSelectedBundles([])
  }

  const toggleBundleStatus = async (status, activeBundle) => {
    const statusKey = `is${upperFirst(status)}`
    const bundle = bundleList.find((b) => b.name === activeBundle)
    if (!bundle) return

    const { name, [statusKey]: isActive } = bundle
    const newActive = !isActive

    const message = `bundle ${name} ${newActive ? 'set' : 'unset'} ${status}`
    let patchResult

    if (newActive) {
      // try and find an old bundle with the same status and unset it
      const oldBundle = bundleList.find((b) => b.name !== name && b[statusKey])
      if (oldBundle) {
        // optimistically update old bundle to remove status
        try {
          const patch = { ...oldBundle, [statusKey]: false }
          patchResult = dispatch(
            ayonApi.util.updateQueryData('getBundleList', { archived: true }, (draft) => {
              const bundleIndex = draft.findIndex((bundle) => bundle.name === oldBundle.name)
              draft[bundleIndex] = patch
            }),
          )
        } catch (error) {
          console.error(error)
        }
      }
    }

    try {
      const patch = { ...bundle, [statusKey]: newActive }
      await updateBundle({ name, data: { [statusKey]: newActive }, patch }).unwrap()
      toast.success(upperFirst(message))
    } catch (error) {
      toast.error(`Error setting ${message}`)
      // revert optimistic update if failed to set new bundle
      patchResult?.undo()
    }
  }

  const handleDeleteBundle = async () => {
    setSelectedBundles([])
    for (const name of selectedBundles) {
      deleteBundle({ name })
    }
  }

  const { confirmRestart } = useServerRestart()

  const handleAddonInstallFinish = () => {
    setUploadOpen(false)
    if (restartRequired) {
      setRestartRequired(false)
      // ask if you want to restart the server
      const message = 'Restart the server to apply changes?'
      confirmRestart(message)
    }
  }

  let uploadHeader = ''
  switch (uploadOpen) {
    case 'addon':
      uploadHeader = 'Install Addons'
      break
    case 'installer':
      uploadHeader = 'Upload Launcher'
      break
    case 'package':
      uploadHeader = 'Upload Dependency Package'
      break
    default:
      break
  }

  // at 1310px wide
  const isCompacted = useMemo(() => window.innerWidth < 1310, [])

  return (
    <>
      <Dialog
        visible={uploadOpen}
        style={{ width: 400, height: 400, overflow: 'hidden' }}
        header={uploadHeader}
        onHide={handleAddonInstallFinish}
      >
        {uploadOpen && (
          <AddonUpload
            onClose={handleAddonInstallFinish}
            type={uploadOpen}
            onInstall={(t) => t === 'addon' && setRestartRequired(true)}
          />
        )}
      </Dialog>
      <main style={{ overflow: 'hidden' }}>
        <Section style={{ minWidth: 400, maxWidth: 400, zIndex: 10 }}>
          <Toolbar>
            <Button label="Create new bundle" icon="add" onClick={handleNewBundleStart} />
            <Button
              label="Install addons"
              icon="input_circle"
              onClick={() => setUploadOpen('addon')}
            />
            <Button
              label={`${isCompacted ? '' : 'Upload'} Launcher`}
              icon="upload"
              onClick={() => setUploadOpen('installer')}
            />
            <Button
              label={`${isCompacted ? '' : 'Upload'} Dependency Package`}
              icon="upload"
              onClick={() => setUploadOpen('package')}
            />
            <span style={{ whiteSpace: 'nowrap' }}>Show Archived</span>
            <InputSwitch
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
          </Toolbar>
          <BundleList
            selectedBundles={selectedBundles}
            onBundleSelect={handleBundleSelect}
            bundleList={bundleList}
            isLoading={isLoading}
            onDuplicate={handleDuplicateBundle}
            onDelete={handleDeleteBundle}
            toggleBundleStatus={toggleBundleStatus}
          />
        </Section>

        {newBundleOpen ? (
          <NewBundle
            initBundle={newBundleOpen}
            onSave={handleNewBundleEnd}
            isLoading={isLoadingInstallers}
            installers={installerVersions}
            addons={addons}
          />
        ) : (
          !!bundlesData.length && (
            <BundleDetail
              bundles={bundlesData}
              onDuplicate={handleDuplicateBundle}
              isLoading={isLoadingInstallers || isLoadingAddons}
              installers={installerVersions}
              toggleBundleStatus={toggleBundleStatus}
              addons={addons}
            />
          )
        )}
      </main>
    </>
  )
}

export default Bundles
