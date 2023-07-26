import { useState, useMemo, useEffect } from 'react'
import BundleList from './BundleList'
import BundleDetail from './BundleDetail'

import { Button, Section, Toolbar } from '@ynput/ayon-react-components'

import {
  useDeleteBundleMutation,
  useGetBundleListQuery,
  useUpdateBundleMutation,
} from '/src/services/bundles'
import getNewBundleName from './getNewBundleName'
import NewBundle from './NewBundle'
import { useGetInstallerListQuery } from '/src/services/installers'
import { useGetAddonListQuery } from '/src/services/addonList'
import { upperFirst } from 'lodash'
import { toast } from 'react-toastify'
import { Dialog } from 'primereact/dialog'
import AddonUpload from '../AddonInstall/AddonUpload'
import { useGetAddonSettingsQuery } from '/src/services/addonSettings'
import getLatestSemver from './getLatestSemver'

const Bundles = () => {
  // addon install dialog
  const [addonInstallOpen, setAddonInstallOpen] = useState(false)

  const [selectedBundle, setSelectedBundle] = useState(null)
  // set a bundle name to open the new bundle form, plus add any extra data
  const [newBundleOpen, setNewBundleOpen] = useState(null)

  // REDUX QUERIES
  const { data: bundleList = [], isLoading } = useGetBundleListQuery({ archived: true })
  const { data: installerList = [], isLoading: isLoadingInstallers } = useGetInstallerListQuery()
  const { data: addons = [], isLoading: isLoadingAddons } = useGetAddonListQuery({
    showVersions: true,
  })
  // REDUX MUTATIONS
  const [deleteBundle] = useDeleteBundleMutation()
  const [updateBundle] = useUpdateBundleMutation()

  // if no bundle selected and newBundleOpen is null, select the first bundle
  useEffect(() => {
    if (!selectedBundle && !newBundleOpen) {
      if (bundleList.length) {
        setSelectedBundle(bundleList[0].name)
      }
    }
  }, [bundleList, selectedBundle, newBundleOpen, setSelectedBundle, setNewBundleOpen])

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
    return coreAddonSettings?.studio_name || 'Studio-Name'
  }, [coreAddonSettings])

  const bundleData = useMemo(() => {
    if (!(bundleList && selectedBundle)) {
      return null
    }
    const result = bundleList.find((bundle) => bundle.name === selectedBundle)
    return result
  }, [bundleList, selectedBundle])

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

  const handleBundleSelect = (name) => {
    setSelectedBundle(name)
    setNewBundleOpen(null)
  }

  const handleNewBundleStart = () => {
    const name = getNewBundleName(studioName, bundleList)
    setNewBundleOpen({ name })
  }

  const handleNewBundleEnd = (name) => {
    setNewBundleOpen(null)
    setSelectedBundle(name)
  }

  const handleDuplicateBundle = (name) => {
    // get the bundle data
    const bundle = bundleList.find((b) => b.name === name)
    if (!bundle) return

    // version up bundle name 01 -> 02
    let newName = name.replace(/(\d+)$/, (match, p1) => {
      return (parseInt(p1) + 1).toString().padStart(2, '0')
    })

    // if there is no xx at the end, add 01
    if (newName === name) {
      newName += '-01'
    }

    setNewBundleOpen({ ...bundle, name: newName })
    setSelectedBundle(null)
  }

  const toggleBundleStatus = async (status) => {
    const statusKey = `is${upperFirst(status)}`
    const bundle = bundleList.find((b) => b.name === selectedBundle)
    if (!bundle) return

    const { name, [statusKey]: isActive } = bundle

    const message = `bundle ${name} ${isActive ? 'set' : 'unset'} ${status}`
    try {
      await updateBundle({ name, [statusKey]: !isActive }).unwrap()
      toast.success(upperFirst(message))
    } catch (error) {
      toast.error(`Error setting ${message}`)
    }
  }

  const handleDeleteBundle = async () => {
    await deleteBundle(selectedBundle).unwrap()
    setSelectedBundle(null)
  }

  return (
    <>
      <Dialog
        visible={addonInstallOpen}
        style={{ width: 400, height: 400, overflow: 'hidden' }}
        header="Install addons"
        onHide={() => setAddonInstallOpen(false)}
      >
        <AddonUpload onClose={() => setAddonInstallOpen(false)} />
      </Dialog>
      <main style={{ overflow: 'hidden' }}>
        <Section style={{ minWidth: 400, maxWidth: 400 }}>
          <Toolbar>
            <Button label="Create new bundle" icon="add" onClick={handleNewBundleStart} />
            <Button
              label="Install addons"
              icon="upload"
              onClick={() => setAddonInstallOpen(true)}
            />
          </Toolbar>
          <BundleList
            selectedBundle={selectedBundle}
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
          <BundleDetail
            bundle={bundleData}
            onDuplicate={handleDuplicateBundle}
            isLoading={isLoadingInstallers || isLoadingAddons}
            installers={installerVersions}
            toggleBundleStatus={toggleBundleStatus}
          />
        )}
      </main>
    </>
  )
}

export default Bundles
