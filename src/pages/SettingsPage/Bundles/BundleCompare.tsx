import { Panel, Section } from '@ynput/ayon-react-components'
import React, { useRef, useState } from 'react'
import BundlesAddonList from './BundlesAddonList'
import useScrollSync from '@hooks/useScrollSync'
import { DataTableSortEvent } from 'primereact/datatable'
import { Addon } from '@pages/SettingsPage/Bundles/types.ts'

type Bundle = {
  name: string
  installerVersion?: string
  addons: Record<string, string | null>
}

type BundleCompareProps = {
  bundles?: Bundle[]
  addons: Addon[]
}

const BundleCompare: React.FC<BundleCompareProps> = ({ bundles = [], addons }) => {
  // for each bundle, in addons check if the same addon has a different version in another bundle
  // if so, set a flag on the addon to show it's different
  const diffAddonVersions: string[] = []
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<0 | 1 | -1 | null | undefined>(null)
  const bundlesAddons: Array<Record<string, string | null>> = bundles.map((b) => b.addons)

  addons.forEach(({ name }) => {
    // from addons get all the versions of that addon
    const versions = bundlesAddons.map((addonMap) => addonMap[name])
    // check to see if all the versions are the same
    const allSame = versions.every((v) => v === versions[0])

    if (!allSame) {
      diffAddonVersions.push(name)
    }
  })

  const [selectedAddons, setSelectedAddons] = useState<any[]>([])
  const addonListRefs = useRef<any[]>([])

  const handleRef = (index: number) => (ref: any) => {
    addonListRefs.current[index] = ref
  }

  useScrollSync(addonListRefs as any, [bundles])
  const handleSort = (e: DataTableSortEvent) => {
    setSortOrder(e.sortOrder)
    setSortField(e.sortField)

  }
  return (
    <Section direction="row" style={{ alignItems: 'flex-start', overflow: 'auto' }}>
      {bundles.map((bundle, index) => (
        <Panel key={bundle.name} style={{ overflow: 'hidden', height: '100%' }}>
          <h2>{bundle.name}</h2>
          <span>Installer: {bundle.installerVersion}</span>
          <BundlesAddonList
            readOnly
            formData={bundle}
            setFormData={() => {}}
            setSelected={setSelectedAddons}
            selected={selectedAddons}
            ref={handleRef(index)}
            diffAddonVersions={diffAddonVersions}
            handleSort={handleSort}
            sortOrder={sortOrder}
            sortField={sortField}
            addons={addons}
          />
        </Panel>
      ))}
    </Section>
  )
}

export default BundleCompare
