import { Button, Section } from '@ynput/ayon-react-components'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { useListAddonsQuery } from '@queries/addons/getAddons'
import { useListBundlesQuery } from '@queries/bundles/getBundles'
import { useUpdateBundleMutation } from '@queries/bundles/updateBundles'
import { useMemo, useState } from 'react'
import { transformAddonsWithBundles } from './helpers'
import AddonsManagerTable from './AddonsManagerTable'
import useGetTableData from './useGetTableData'
import { useDispatch, useSelector } from 'react-redux'
import {
  onDeletedVersions,
  onSelectedAddons,
  onSelectedBundles,
  onSelectedVersions,
} from '@state/addonsManager'
import { useNavigate } from 'react-router'
import { useDeleteAddonVersionsMutation } from '@queries/addons/updateAddons'
import { useRestart } from '@context/restartContext'
import { Link } from 'react-router-dom'
import AddonDialog from '@components/AddonDialog/AddonDialog'
import Shortcuts from '@containers/Shortcuts'

const AddonsManager = () => {
  const navigate = useNavigate()
  // QUERIES
  const { data: { addons = [] } = {}, isLoading } = useListAddonsQuery({})
  const { data: { bundles = [] } = {} } = useListBundlesQuery({ archived: false })

  // addon upload dialog
  const [uploadOpen, setUploadOpen] = useState('')

  // addonsVersionsBundles = Map<addon, Map<version, Map<bundle, bundle>>>
  const addonsVersionsBundles = useMemo(
    () => transformAddonsWithBundles(addons, bundles),
    [bundles, addons],
  )

  // MUTATIONS
  const [updateBundle] = useUpdateBundleMutation()
  const [deleteAddonVersions] = useDeleteAddonVersionsMutation()

  // SELECTION STATES (handled in redux)
  const dispatch = useDispatch()

  const selectedAddons = useSelector((state) => state.addonsManager.selectedAddons)
  const selectedVersions = useSelector((state) => state.addonsManager.selectedVersions)
  const selectedBundles = useSelector((state) => state.addonsManager.selectedBundles)
  const deletedVersions = useSelector((state) => state.addonsManager.deletedVersions)

  const setSelectedAddons = (addons) => dispatch(onSelectedAddons(addons))
  const setSelectedVersions = (versions) => dispatch(onSelectedVersions(versions))
  const setSelectedBundles = (bundles) => dispatch(onSelectedBundles(bundles))
  const setDeletedVersions = (versions) => dispatch(onDeletedVersions(versions))

  // different functions to transform the data for each table
  let { addonsTableData, versionsTableData, bundlesTableData, filteredVersionsMap, versionSort } =
    useGetTableData(addonsVersionsBundles, selectedAddons, selectedVersions, deletedVersions)

  // SELECTION HANDLERS vvv
  const handleVersionSelect = (versions) => {
    setSelectedVersions(versions)

    // remove bundles that are not in the selected versions
    const newBundles = selectedBundles.filter((b) =>
      selectedVersions.some((v) => filteredVersionsMap.get(v)?.has(b)),
    )

    setSelectedBundles(newBundles)
  }

  const handleAddonsSelect = (addons) => {
    setSelectedAddons(addons)

    // remove versions that are not in the selected addons
    const newVersions = selectedVersions.filter((v) => addons.some((a) => v.includes(a)))
    handleVersionSelect(newVersions)
  }
  // SELECTION HANDLERS ^^^

  // DELETE HANDLERS vvv
  // Note: we don't use any try/catch here because confirm delete catches errors and displays them
  const handleBundlesArchive = async (selected = []) => {
    const bundleMap = new Map(bundles.map((bundle) => [bundle.name, bundle]))

    const updatePromises = selected.map((bundleName) => {
      const bundleData = bundleMap.get(bundleName)
      if (!bundleData || bundleData.isProduction || bundleData.isStaging || bundleData.isDev) return
      return updateBundle({ name: bundleName, data: { isArchived: true } })
    })

    await Promise.all(updatePromises)
  }

  const handleDeleteVersions = async (versions = []) => {
    const addonsToDelete = []
    for (const version of versions) {
      const addonName = version.split(' ')[0]
      const addonVersion = version.split(' ')[1]
      // check addonName and addonVersion exist
      const addon = addons.find((a) => a.name === addonName)
      const addonVersionExists = Object.entries(addon?.versions || {}).some(
        ([v]) => v === addonVersion,
      )

      if (addonVersionExists) {
        addonsToDelete.push({ name: addonName, version: addonVersion })
      }
    }

    await deleteAddonVersions({ addons: addonsToDelete })
  }
  // DELETE HANDLERS ^^^

  // RESTART SERVER
  const { restartRequired } = useRestart()
  const restartServer = () => {
    // remove deleted versions from deletedVersions state and restart server
    restartRequired({ callback: () => setDeletedVersions([]) })
  }

  // DELETE SUCCESS HANDLERS vvv
  const handleDeleteVersionsSuccess = async (versions = []) => {
    // remove versions from selectedVersions
    const newVersions = selectedVersions.filter((v) => !versions.includes(v))
    setSelectedVersions(newVersions)
    // add versions to deletedVersions state
    setDeletedVersions([...deletedVersions, ...versions])
    // ask if they want to restart the server for the changes to take effect
    restartServer()
  }
  // DELETE SUCCESS HANDLERS ^^^

  const viewInMarket = (selected) => [
    {
      label: 'View in Market',
      command: () => navigate(`/market?selected=${selected[0].split(' ')[0]}`),
      icon: 'store',
    },
  ]

  const shortcuts = [
    {
      key: 'a',
      action: () => setUploadOpen('addon'),
    },
  ]

  const loadingData = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => ({
      key: i,
      data: {},
    }))
  }, [])

  // LOADING DUMMY DATA
  if (isLoading) {
    addonsTableData = loadingData
    versionsTableData = loadingData
    bundlesTableData = loadingData
  }

  return (
    <Section style={{ overflow: 'hidden' }}>
      <Shortcuts shortcuts={shortcuts} />
      <Splitter style={{ height: '100%', padding: 8 }}>
        <SplitterPanel>
          <AddonDialog uploadOpen={uploadOpen} setUploadOpen={setUploadOpen} />
          {/* ADDONS TABLE */}
          <AddonsManagerTable
            title="Addons"
            value={addonsTableData}
            selection={selectedAddons}
            onChange={handleAddonsSelect}
            field={'name'}
            header={
              <div style={{ display: 'flex', gap: '4px' }}>
                <Button
                  onClick={() => setUploadOpen('addon')}
                  data-shortcut="A"
                  data-tooltip="Upload addon zip files"
                  label="Upload Addons"
                  icon="upload"
                  style={{ width: '100%' }}
                />
                <Link to="/market" style={{ width: '100%' }}>
                  <Button label="Addon Market" icon="store" style={{ width: '100%' }} />
                </Link>
              </div>
            }
            extraContext={viewInMarket}
            emptyMessage="No addons found"
            isLoading={isLoading}
          />
        </SplitterPanel>
        <SplitterPanel>
          {/* VERSIONS TABLE */}
          <AddonsManagerTable
            title="Versions"
            value={versionsTableData}
            selection={selectedVersions}
            onChange={handleVersionSelect}
            field={'version'}
            sortFunction={versionSort}
            onDelete={handleDeleteVersions}
            onDeleteSuccess={handleDeleteVersionsSuccess}
            extraContext={viewInMarket}
            emptyMessage={selectedAddons.length ? 'No versions found' : 'Select an addon'}
            isLoading={isLoading}
          />
        </SplitterPanel>
        <SplitterPanel>
          {/* BUNDLES TABLE */}
          <AddonsManagerTable
            title="Bundles"
            value={bundlesTableData}
            selection={selectedBundles}
            onChange={setSelectedBundles}
            field={'name'}
            onDelete={handleBundlesArchive}
            isArchive
            extraContext={(sel) => [
              {
                label: 'View bundle',
                command: () => navigate(`/settings/bundles?selected=${sel[0]}`),
                icon: 'arrow_circle_right',
              },
            ]}
            emptyMessage={selectedVersions.length ? 'No bundles found' : 'Select versions'}
            isLoading={isLoading}
          />
        </SplitterPanel>
        {/* <SplitterPanel>
          <Section style={{ height: '100%' }}>
            <h2 style={{ margin: 0, paddingTop: 8 }}>Addon Upload</h2>
            <AddonUpload type="addon" dropOnly />
            <h2 style={{ margin: 0 }}>Dependency Package Upload</h2>
            <AddonUpload type="package" dropOnly />
            <h2 style={{ margin: 0 }}>Installer Upload</h2>
            <AddonUpload type="installer" dropOnly />
          </Section>
        </SplitterPanel> */}
      </Splitter>
    </Section>
  )
}

export default AddonsManager
