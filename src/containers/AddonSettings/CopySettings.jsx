import { useState, useEffect, useMemo } from 'react'
import { toast } from 'react-toastify'
import { Button, Dropdown, Toolbar, TablePanel, Spacer } from '@ynput/ayon-react-components'

import { Dialog } from 'primereact/dialog'
import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'

import { useGetBundleListQuery } from '/src/services/bundles'
import {
  useLazyGetAddonSettingsQuery,
  useLazyGetAddonSettingsOverridesQuery,
} from '/src/services/addonSettings'

import VariantSelector from './VariantSelector'
import { setValueByPath } from './utils'

import { cloneDeep } from 'lodash'

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

const CopySettingsTable = ({ sourceBundle, sourceVariant, targetBundle, nodes, setNodes }) => {
  //
  // targetBundle is used just to get the list of addons
  //

  const [selectedNodes, setSelectedNodes] = useState([])

  const {
    data: bundlesData,
    isLoading: bundlesLoading,
    isError: bundlesError,
  } = useGetBundleListQuery({})

  const [triggerGetOverrides] = useLazyGetAddonSettingsOverridesQuery()

  const loadNodes = async () => {
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

        const children = []
        const res = await triggerGetOverrides({
          addonName,
          addonVersion: sourceAddonVersion,
          variant: sourceVariant,
        })
        for (const id in res.data) {
          const override = res.data[id]
          if (override.inGroup || override.type === 'branch') continue
          const item = {
            key: id,
            data: {
              path: override.path,
              newValue: override.value,
            },
          }
          children.push(item)
        }

        if (!children.length) continue

        addonList.push({
          key: `${addonName}-${sourceAddonVersion}`,
          data: {
            addonName: addonName,
            addonVersion: sourceAddonVersion,
            targetAddonVersion: targetBundleData.addons[addonName],
          },
          children: children,
        })
      }
    }

    setNodes(addonList)
  }

  useEffect(() => {
    loadNodes()
  }, [bundlesData, sourceBundle, sourceVariant, targetBundle])

  const formatVersionColumn = (rowData) => {
    if (rowData.data.addonVersion === rowData.data.targetAddonVersion) {
      return rowData.data.addonVersion
    }
    return `${rowData.data.addonVersion} ⟶ ${rowData.data.targetAddonVersion}`
  }

  const formatPathColumn = (rowData) => {
    return rowData.data?.path?.join(' / ')
  }

  return (
    <TablePanel style={{ minHeight: 500, marginTop: 12, flexGrow: 1 }} loading={{ bundlesLoading }}>
      <TreeTable
        selectionMode="multiple"
        selectionKeys={selectedNodes}
        onSelectionChange={(e) => setSelectedNodes(e.value)}
        value={nodes}
        emptyMessage="No settings to copy"
      >
        <Column field="addonName" header="Addon name" expander />
        <Column field="version" header="Addon version" body={formatVersionColumn} />
        <Column field="path" header="Path" body={formatPathColumn} />
        <Column field="currentValue" header="Current value" />
        <Column field="newValue" header="New value" />
      </TreeTable>
    </TablePanel>
  )
}

const CopySettingsButton = ({
  bundleName,
  variant,
  disabled,
  localData,
  setLocalData,
  localOverrides,
  setLocalOverrides,
  setSelectedAddons,
  originalData,
  setOriginalData,
  projectName,
}) => {
  const [dialogVisible, setDialogVisible] = useState(false)
  const [sourceBundle, setSourceBundle] = useState(bundleName)
  const [sourceVariant, setSourceVariant] = useState('production')
  const [nodes, setNodes] = useState([])

  const [triggerGetSettings] = useLazyGetAddonSettingsQuery()

  const onDoTheMagic = async () => {
    const newLocalData = cloneDeep(localData)
    const newLocalOverrides = { ...localOverrides }
    const newOriginalData = { ...originalData }
    const newSelectedAddons = []

    for (const node of nodes) {
      console.log('Migrating node', node.data.addonName, node.data.addonVersion)

      // Define the target addon
      const siteId = '_'
      const projectKey = projectName || '_'
      const key = `${node.data.addonName}|${node.data.targetAddonVersion}|${variant}|${siteId}|${projectKey}`
      const addon = {
        name: node.data.addonName,
        version: node.data.targetAddonVersion,
        variant: variant,
        siteId,
        key,
      }

      // Get current settings of the target addon

      let addonSettings = newLocalData[key]
      let addonOverrides = []
      if (!localData[key]) {
        const res = await triggerGetSettings({
          addonName: node.data.addonName,
          addonVersion: node.data.targetAddonVersion,
          projectName,
          siteId,
          variant,
        })
        newOriginalData[key] = res.data
        addonSettings = cloneDeep(res.data)
      }

      // Iterate over the changes and apply them to the target addon

      for (const change of node.children) {
        if (change.data.newValue) {
          addonSettings = setValueByPath(addonSettings, change.data.path, change.data.newValue)
          console.log('Copied', change.data.path.join('/'), change.data.newValue)
          addonOverrides.push(change.data.path)
        } else console.warn('Not implemented copy', change.data.path.join('/'))
      } // for change of node.children

      newLocalData[key] = addonSettings
      newLocalOverrides[key] = addonOverrides
      newSelectedAddons.push(addon)
    } // for node of nodes

    console.log('NEw local data', newLocalData)
    setOriginalData(newOriginalData)
    setLocalData(newLocalData)
    setLocalOverrides(newLocalOverrides)
    setSelectedAddons(newSelectedAddons)
    toast.success('Settings copied')
  }

  //
  // Render
  //

  const footer = (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Spacer />
      <Button label="Copy settings" icon="input" onClick={() => onDoTheMagic()} />
    </div>
  )

  return (
    <>
      <Button
        icon="input"
        tooltip="Copy bundle settings from..."
        onClick={() => setDialogVisible(true)}
        disabled={disabled || !bundleName}
      />
      {dialogVisible && (
        <Dialog
          header={`Copy ${bundleName} ${variant} settings from...`}
          visible
          onHide={() => setDialogVisible(false)}
          style={{ width: '80%', height: '80%' }}
          footer={footer}
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
            nodes={nodes}
            setNodes={setNodes}
          />
        </Dialog>
      )}
    </>
  )
}

export default CopySettingsButton
