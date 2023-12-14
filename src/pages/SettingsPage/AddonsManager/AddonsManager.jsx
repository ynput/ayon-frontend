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
  const versionsTableData = useMemo(
    () => transformVersionsTable(addonsVersionsBundles, selectedAddons),
    [selectedAddons, addonsVersionsBundles],
  )

  const bundlesTableData = useMemo(
    () => transformBundlesTable(addonsVersionsBundles, selectedAddons, selectedVersions),
    [addonsVersionsBundles, selectedAddons, selectedVersions],
  )

  return (
    <Section style={{ overflow: 'hidden' }}>
      <Splitter style={{ height: '100%', padding: 8 }}>
        <SplitterPanel>
          <AddonsManagerTable
            header="Addons"
            value={addonsTableData}
            selection={selectedAddons}
            onChange={setSelectedAddons}
            field={'name'}
          />
        </SplitterPanel>
        <SplitterPanel>
          <AddonsManagerTable
            header="Versions"
            value={versionsTableData}
            selection={selectedVersions}
            onChange={setSelectedVersions}
            field={'version'}
          />
        </SplitterPanel>
        <SplitterPanel>
          <AddonsManagerTable
            header="Bundles"
            value={bundlesTableData}
            selection={selectedBundles}
            onChange={setSelectedBundles}
            field={'name'}
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
