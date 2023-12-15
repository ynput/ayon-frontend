import { Section } from '@ynput/ayon-react-components'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { useGetAddonListQuery } from '/src/services/addons/getAddons'
import { useGetBundleListQuery } from '/src/services/bundles'
import { useMemo, useState } from 'react'
import {
  transformAddonsTable,
  transformAddonsWithBundles,
  transformBundlesTable,
  transformVersionsTable,
} from './helpers'
import AddonsManagerTable from './AddonsManagerTable'

const AddonsManager = () => {
  const { data: addons = [] } = useGetAddonListQuery()
  const { data: bundles = [] } = useGetBundleListQuery({ archived: false })

  // addonsVersionsBundles = Map<addon, Map<version, Map<bundle, bundle>>>
  const addonsVersionsBundles = useMemo(
    () => transformAddonsWithBundles(addons, bundles),
    [bundles, addons],
  )

  // STATES
  // selected addon name or null
  const [selectedAddons, setSelectedAddons] = useState([])
  // selected addon version or null
  const [selectedVersions, setSelectedVersions] = useState([])
  // selected bundle name or null
  const [selectedBundles, setSelectedBundles] = useState([])

  // status  = ['active', 'production', 'staging', 'dev'] | []
  // active:  addon has some versions with bundles
  // For each status (production, staging, dev), check if the addon has any versions with bundles of that status.
  // []: addon has no versions with bundles
  // simplify data down to [{name, status}]  const addonsTableData = useMemo(() => {
  const addonsTableData = useMemo(
    () => transformAddonsTable(addonsVersionsBundles),
    [addonsVersionsBundles],
  )

  // based on selectedAddons, create versionsTableData in the same format as addonsTableData
  const [filteredVersionsMap, versionsTableData] = useMemo(
    () => transformVersionsTable(addonsVersionsBundles, selectedAddons),
    [selectedAddons, addonsVersionsBundles],
  )

  const bundlesTableData = useMemo(
    () => transformBundlesTable(addonsVersionsBundles, selectedAddons, selectedVersions),
    [addonsVersionsBundles, selectedAddons, selectedVersions],
  )

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

  // do any of the selectedBundles have status 'production', 'staging', 'dev'?
  const isSelectedBundlesProtected = selectedBundles.some((b) =>
    bundlesTableData.some((d) => d.name === b && d.status.length),
  )

  return (
    <Section style={{ overflow: 'hidden' }}>
      <Splitter style={{ height: '100%', padding: 8 }}>
        <SplitterPanel>
          <AddonsManagerTable
            header="Addons"
            value={addonsTableData}
            selection={selectedAddons}
            onChange={handleAddonsSelect}
            field={'name'}
            enableDelete={!!selectedAddons.length && !versionsTableData.length}
          />
        </SplitterPanel>
        <SplitterPanel>
          <AddonsManagerTable
            header="Versions"
            value={versionsTableData}
            selection={selectedVersions}
            onChange={handleVersionSelect}
            field={'version'}
            enableDelete={!!selectedVersions.length && !bundlesTableData.length}
          />
        </SplitterPanel>
        <SplitterPanel>
          <AddonsManagerTable
            header="Bundles"
            value={bundlesTableData}
            selection={selectedBundles}
            onChange={setSelectedBundles}
            field={'name'}
            enableDelete={!!selectedBundles.length && !isSelectedBundlesProtected}
          />
        </SplitterPanel>
        <SplitterPanel>
          <div>uploads</div>
        </SplitterPanel>
      </Splitter>
    </Section>
  )
}

export default AddonsManager
