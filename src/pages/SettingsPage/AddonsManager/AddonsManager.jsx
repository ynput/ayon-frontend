import { Section } from '@ynput/ayon-react-components'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { useGetAddonListQuery } from '/src/services/addons/getAddons'
import { useGetBundleListQuery, useUpdateBundleMutation } from '/src/services/bundles'
import { useMemo } from 'react'
import { transformAddonsWithBundles } from './helpers'
import AddonsManagerTable from './AddonsManagerTable'
import useGetTableData from './useGetTableData'
import { useDispatch, useSelector } from 'react-redux'
import {
  onSelectedAddons,
  onSelectedBundles,
  onSelectedVersions,
} from '/src/features/addonsManager'
import { useNavigate } from 'react-router'
import AddonUpload from '../AddonInstall/AddonUpload'

const AddonsManager = () => {
  const navigate = useNavigate()
  // QUERIES
  const { data: addons = [] } = useGetAddonListQuery()
  const { data: bundles = [] } = useGetBundleListQuery({ archived: false })

  // addonsVersionsBundles = Map<addon, Map<version, Map<bundle, bundle>>>
  const addonsVersionsBundles = useMemo(
    () => transformAddonsWithBundles(addons, bundles),
    [bundles, addons],
  )

  // MUTATIONS
  const [updateBundle] = useUpdateBundleMutation()

  // SELECTION STATES (handled in redux)
  const dispatch = useDispatch()

  const selectedAddons = useSelector((state) => state.addonsManager.selectedAddons)
  const selectedVersions = useSelector((state) => state.addonsManager.selectedVersions)
  const selectedBundles = useSelector((state) => state.addonsManager.selectedBundles)

  const setSelectedAddons = (addons) => dispatch(onSelectedAddons(addons))
  const setSelectedVersions = (versions) => dispatch(onSelectedVersions(versions))
  const setSelectedBundles = (bundles) => dispatch(onSelectedBundles(bundles))

  // different functions to transform the data for each table
  const { addonsTableData, versionsTableData, bundlesTableData, filteredVersionsMap } =
    useGetTableData(addonsVersionsBundles, selectedAddons, selectedVersions)

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
    console.log(versions)
  }

  const handleDeleteWholeAddons = async (addons = []) => {
    console.log(addons)
  }
  // DELETE HANDLERS ^^^

  return (
    <Section style={{ overflow: 'hidden' }}>
      <Splitter style={{ height: '100%', padding: 8 }}>
        <SplitterPanel>
          {/* ADDONS TABLE */}
          <AddonsManagerTable
            header="Addons"
            value={addonsTableData}
            selection={selectedAddons}
            onChange={handleAddonsSelect}
            onDelete={handleDeleteWholeAddons}
            field={'name'}
          />
        </SplitterPanel>
        <SplitterPanel>
          {/* VERSIONS TABLE */}
          <AddonsManagerTable
            header="Versions"
            value={versionsTableData}
            selection={selectedVersions}
            onChange={handleVersionSelect}
            field={'version'}
            onDelete={handleDeleteVersions}
          />
        </SplitterPanel>
        <SplitterPanel>
          {/* BUNDLES TABLE */}
          <AddonsManagerTable
            header="Bundles"
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
          />
        </SplitterPanel>
        <SplitterPanel>
          <Section style={{ height: '100%' }}>
            <h2 style={{ margin: 0, paddingTop: 8 }}>Addon Upload</h2>
            <AddonUpload type="addon" dropOnly />
            <h2 style={{ margin: 0 }}>Dependency Package Upload</h2>
            <AddonUpload type="package" dropOnly />
            <h2 style={{ margin: 0 }}>Installer Upload</h2>
            <AddonUpload type="installer" dropOnly />
          </Section>
        </SplitterPanel>
      </Splitter>
    </Section>
  )
}

export default AddonsManager
