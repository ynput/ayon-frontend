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
import { getValueByPath, setValueByPath } from './utils'

import { cloneDeep, isEqual } from 'lodash'

const BundleDropdown = ({ bundleName, setBundleName, disabled }) => {
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
      disabled={disabled}
    />
  )
}

const CopySettingsTable = ({
  sourceBundle,
  sourceVariant,
  targetBundle,
  targetVariant,
  nodes,
  setNodes,
}) => {
  //
  // targetBundle is used just to get the list of addons
  //

  const [selectedNodes, setSelectedNodes] = useState({})
  const [loading, setLoading] = useState(false)

  const {
    data: bundlesData,
    isLoading: bundlesLoading,
    isError: bundlesError,
  } = useGetBundleListQuery({})

  const [triggerGetOverrides] = useLazyGetAddonSettingsOverridesQuery()
  const [triggerGetSettings] = useLazyGetAddonSettingsQuery()

  useEffect(() => {
    setLoading(bundlesLoading)
  }, [bundlesLoading])

  useEffect(() => {
    for (const node of nodes) {
      for (const child of node.children) {
        if (Object.keys(selectedNodes).includes(child.key)) {
          console.log('selected', child.key)
          console.log(child)
        }
      }
    }
  }, [selectedNodes])

  const loadNodes = async () => {
    if (bundlesLoading || bundlesError) {
      setNodes([])
      return
    }

    if (sourceBundle === targetBundle && sourceVariant === targetVariant) {
      console.log('same bundle and variant')
      setNodes([])
      return
    }

    setLoading(true)

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
        const sourceOverrides = await triggerGetOverrides({
          addonName,
          addonVersion: sourceAddonVersion,
          variant: sourceVariant,
        })

        // TODO: we may use this to display whether there
        // is an override or we are replacing with a default value

        // const targetOverrides = await triggerGetOverrides({
        //   addonName,
        //   addonVersion: targetBundleData.addons[addonName],
        //   variant: targetVariant,
        // })

        const sourceSettings = await triggerGetSettings({
          addonName,
          addonVersion: sourceAddonVersion,
          variant: sourceVariant,
        })

        const targetSettings = await triggerGetSettings({
          addonName,
          addonVersion: targetBundleData.addons[addonName],
          variant: targetVariant,
        })

        for (const id in sourceOverrides.data) {
          const sourceOverride = sourceOverrides.data[id]
          //const targetOverride = targetOverrides.data[id]

          if (sourceOverride.inGroup || sourceOverride.type === 'branch') continue

          const sourceValue = getValueByPath(sourceSettings.data, sourceOverride.path)
          const targetValue = getValueByPath(targetSettings.data, sourceOverride.path)

          if (isEqual(sourceValue, targetValue)) continue

          const item = {
            key: id,
            data: {
              path: sourceOverride.path,
              sourceValue,
              targetValue,
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
            sourceSettings,
          },
          children: children,
        })
      }
    }

    setNodes(addonList)
    setLoading(false)
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

  const formatValue = (value) => {
    if (value === undefined) return ''
    if (value === null) return 'null'
    if (typeof value === 'object') return '[Complex object]'
    return value
  }

  return (
    <TablePanel style={{ minHeight: 500, marginTop: 12, flexGrow: 1 }}>
      <TreeTable
        selectionMode="multiple"
        selectionKeys={selectedNodes}
        onSelectionChange={(e) => setSelectedNodes(e.value)}
        value={nodes}
        emptyMessage="Nothing to copy"
        loading={loading}
      >
        <Column field="addonName" header="Addon name" expander />
        <Column field="version" header="Addon version" body={formatVersionColumn} />
        <Column field="path" header="Path" body={formatPathColumn} />
        <Column
          field="targetValue"
          header="Current value"
          body={(r) => formatValue(r.data.targetValue)}
        />
        <Column
          field="sourceValue"
          header="New value"
          body={(r) => formatValue(r.data.sourceValue)}
        />
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

  //const [triggerGetSettings] = useLazyGetAddonSettingsQuery()

  const doTheMagic = async () => {
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
        newOriginalData[key] = node.data.sourceSettings.data
        addonSettings = cloneDeep(newOriginalData[key])
      }

      // Iterate over the changes and apply them to the target addon

      for (const change of node.children) {
        addonSettings = setValueByPath(addonSettings, change.data.path, change.data.sourceValue)
        addonOverrides.push(change.data.path)
        console.log('Copied', change.data.path.join('/'), change.data.newValue)
      } // for change of node.children

      newLocalData[key] = addonSettings
      newLocalOverrides[key] = addonOverrides
      newSelectedAddons.push(addon)
    } // for node of nodes

    setOriginalData(newOriginalData)
    setLocalData(newLocalData)
    setLocalOverrides(newLocalOverrides)
    setSelectedAddons(newSelectedAddons)
    toast.success('Settings copied')
    setDialogVisible(false)
  }

  //
  // Render
  //

  const footer = (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Spacer />
      <Button label="Copy settings" icon="input" onClick={() => doTheMagic()} />
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
          header={`Copy settings from...`}
          visible
          onHide={() => setDialogVisible(false)}
          style={{ width: '80%', height: '80%' }}
          footer={footer}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Toolbar>
              Source bundle
              <BundleDropdown bundleName={sourceBundle} setBundleName={setSourceBundle} />
              <VariantSelector variant={sourceVariant} setVariant={setSourceVariant} />
            </Toolbar>
            <Toolbar>
              Target bundle
              <BundleDropdown bundleName={bundleName} setBundleName={() => {}} disabled />
              <VariantSelector variant={variant} setVariant={() => {}} disabled />
            </Toolbar>
            <CopySettingsTable
              sourceBundle={sourceBundle}
              sourceVariant={sourceVariant}
              targetBundle={bundleName}
              targetVariant={variant}
              nodes={nodes}
              setNodes={setNodes}
            />
          </div>
        </Dialog>
      )}
    </>
  )
}

export default CopySettingsButton
