import { useState, useEffect, useMemo } from 'react'
import { Button, Dropdown, Toolbar, TablePanel } from '@ynput/ayon-react-components'

import { Dialog } from 'primereact/dialog'
import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'

import { useGetBundleListQuery } from '/src/services/bundles'
import { useLazyGetAddonSettingsOverridesQuery } from '/src/services/addonSettings'

import VariantSelector from './VariantSelector'

const BundleDropdown = ({ bundleName, setBundleName }) => {
  const { data, isLoading, isError } = useGetBundleListQuery({})

  const bundleOptions = useMemo(() => {
    if (isLoading || isError) return []
    return data.map((i) => ({ value: i.name }))
  }, [data])

  return (
    <Dropdown
      value={bundleName ? [bundleName] : null}
      options={bundleOptions}
      onChange={(e) => setBundleName(e[0])}
      placeholder="Select a bundle"
      style={{ flexGrow: 1 }}
    />
  )
}

const CopySettingsTable = ({ sourceBundle, sourceVariant, targetBundle }) => {
  //
  // targetBundle is used just to get the list of addons
  //

  const [nodes, setNodes] = useState([])
  const [selectedNodes, setSelectedNodes] = useState([])

  const {
    data: bundlesData,
    isLoading: bundlesLoading,
    isError: bundlesError,
  } = useGetBundleListQuery({})

  const [triggerGetOverrides] = useLazyGetAddonSettingsOverridesQuery()

  useEffect(() => {
    if (bundlesLoading || bundlesError) return

    let sourceBundleData = {}
    let targetBundleData = {}

    for (const bundle of bundlesData) {
      if (bundle.name === sourceBundle) {
        sourceBundleData = bundle
      }
      if (bundle.name === targetBundle) {
        targetBundleData = bundle
      }
    }

    if (!(sourceBundleData?.addons && targetBundleData?.addons)) {
      console.log('no addons')
      return
    }

    const addonList = []
    for (const addonName in targetBundleData.addons) {
      if (addonName && Object.keys(sourceBundleData.addons).includes(addonName)) {
        const sourceAddonVersion = sourceBundleData.addons[addonName]

        addonList.push({
          key: `${addonName}-${sourceAddonVersion}`,
          leaf: false,
          data: {
            addonName: addonName,
            addonVersion: sourceAddonVersion,
          },
        })
      }
    }

    setNodes(addonList)
  }, [bundlesData, sourceBundle, sourceVariant, targetBundle])

  const onExpand = async (event) => {
    if (!event.node.children) {
      let lazyNode = event.node
      lazyNode.children = []

      const res = await triggerGetOverrides({
        addonName: event.node.data.addonName,
        addonVersion: event.node.data.addonVersion,
        variant: sourceVariant,
      })

      console.log('res', res)
      for (const id in res.data) {
        const override = res.data[id]
        if (override.inGroup || override.type === 'branch') continue
        const item = {
          key: id,
          data: {
            path: override.path.join(' / '),
            newValue: override.value,
          },
        }
        lazyNode.children.push(item)
      }

      let _nodes = nodes.map((node) => {
        if (node.key === event.node.key) {
          node = lazyNode
        }

        return node
      })

      setNodes(_nodes)
    } // if no children
  }

  return (
    <TablePanel style={{ minHeight: 500, marginTop: 12, flexGrow: 1 }} loading={{ bundlesLoading }}>
      <TreeTable
        selectionMode="multiple"
        selectionKeys={selectedNodes}
        onSelectionChange={(e) => setSelectedNodes(e.value)}
        value={nodes}
        onExpand={onExpand}
      >
        <Column field="addonName" header="Addon name" expander />
        <Column field="path" header="Path" />
        <Column field="currentValue" header="Current value" />
        <Column field="newValue" header="New value" />
      </TreeTable>
    </TablePanel>
  )
}

const CopySettingsButton = ({ bundleName, variant }) => {
  const [dialogVisible, setDialogVisible] = useState(false)
  const [sourceBundle, setSourceBundle] = useState(bundleName)
  const [sourceVariant, setSourceVariant] = useState('production')

  return (
    <>
      <Button
        icon="input"
        tooltip="Copy bundle settings from..."
        onClick={() => setDialogVisible(true)}
      />
      {dialogVisible && (
        <Dialog
          header={`Copy ${bundleName} ${variant} settings from...`}
          visible
          onHide={() => setDialogVisible(false)}
          style={{ width: '50vw' }}
          footer={<Button label="Copy selected" onClick={() => setDialogVisible(false)} />}
        >
          <Toolbar>
            Source bundle
            <BundleDropdown bundleName={sourceBundle} setBundleName={setSourceBundle} />
            <VariantSelector variant={sourceVariant} setVariant={setSourceVariant} />
          </Toolbar>
          <CopySettingsTable
            sourceBundle={sourceBundle}
            sourceVariant={sourceVariant}
            targetBundle={bundleName}
          />
        </Dialog>
      )}
    </>
  )
}

export default CopySettingsButton
