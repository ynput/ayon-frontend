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
import { useGetAllProjectsQuery } from '/src/services/project/getProject'

import VariantSelector from './VariantSelector'
import { getValueByPath, setValueByPath } from './utils'

import { cloneDeep, isEqual } from 'lodash'

import styled from 'styled-components'
import { Icon } from '@ynput/ayon-react-components'

const DialogBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const ToolPanel = styled.div`
  display: flex;
  flex-direction: row;
  flex-grow: 1;
  gap: 16px;
  align-items: center;
  justify-content: flex-center;
`

const ToolSection = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: 8px;
`

const ToolSectionSeparator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  .icon {
    font-size: 4rem;
    padding: 12px;
    border-radius: var(--border-radius-m);
    user-select: none;
  }
`

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

const ProjectDropdown = ({ projectName, setProjectName, disabled }) => {
  const { data, isLoading, isError } = useGetAllProjectsQuery()

  const projectOptions = useMemo(() => {
    if (isLoading || isError) return []
    return data.map((i) => ({ value: i.name }))
  }, [data])

  return (
    <Dropdown
      value={projectName ? [projectName] : null}
      options={projectOptions}
      onChange={(e) => setProjectName(e[0])}
      placeholder="Select a project"
      style={{ flexGrow: 1 }}
      disabled={disabled}
    />
  )
}

const CopySettingsTable = ({
  sourceBundle,
  sourceVariant,
  sourceProjectName,
  targetProjectName,
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

  // useEffect(() => {
  //   for (const node of nodes) {
  //     for (const child of node.children) {
  //       if (Object.keys(selectedNodes).includes(child.key)) {
  //         console.log('selected', child.key)
  //         console.log(child)
  //       }
  //     }
  //   }
  // }, [selectedNodes])

  const loadNodes = async () => {
    if (bundlesLoading || bundlesError) {
      setNodes([])
      return
    }

    if (
      sourceBundle === targetBundle &&
      sourceVariant === targetVariant &&
      sourceProjectName === targetProjectName
    ) {
      console.warn('same bundle and variant')
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
      setNodes([])
      setLoading(false)
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
          projectName: sourceProjectName,
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
          projectName: sourceProjectName,
        })

        const targetSettings = await triggerGetSettings({
          addonName,
          addonVersion: targetBundleData.addons[addonName],
          variant: targetVariant,
          projectName: targetProjectName,
        })

        for (const id in sourceOverrides.data) {
          const sourceOverride = sourceOverrides.data[id]
          //const targetOverride = targetOverrides.data[id]

          // Remove noise
          if (sourceOverride.inGroup || sourceOverride.type === 'branch') continue

          // do not attempt to copy overrides from default or studio
          // to project level
          if (targetProjectName && ['default', 'studio'].includes(sourceOverride.level)) continue

          const sourceValue = getValueByPath(sourceSettings.data, sourceOverride.path)
          const targetValue = getValueByPath(targetSettings.data, sourceOverride.path)

          // do not attempt to copy if the values are the same
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
            targetSettings,
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
  }, [
    bundlesData,
    sourceBundle,
    sourceVariant,
    sourceProjectName,
    targetBundle,
    targetVariant,
    targetProjectName,
  ])

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
  changedKeys,
  setChangedKeys,
  setSelectedAddons,
  originalData,
  setOriginalData,
  projectName,
}) => {
  const [dialogVisible, setDialogVisible] = useState(false)
  const [sourceBundle, setSourceBundle] = useState(bundleName)
  const [sourceVariant, setSourceVariant] = useState(variant)
  const [sourceProjectName, setSourceProjectName] = useState(projectName)
  const [nodes, setNodes] = useState([])

  //eslint-disable-next-line
  const doTheMagic = async (copySelected = false) => {
    const newLocalData = cloneDeep(localData)
    const newChangedKeys = { ...changedKeys }
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

      const addonOverrides = []
      let addonSettings = cloneDeep(node.data.targetSettings.data)
      newOriginalData[key] = cloneDeep(node.data.targetSettings.data)

      // Iterate over the changes and apply them to the target addon

      for (const change of node.children) {
        const value = cloneDeep(change.data.sourceValue)
        addonSettings = setValueByPath(addonSettings, change.data.path, value)
        addonOverrides.push(change.data.path)
      } // for change of node.children

      newLocalData[key] = addonSettings
      newChangedKeys[key] = addonOverrides
      newSelectedAddons.push(addon)
    } // for node of nodes

    setOriginalData(newOriginalData)
    setLocalData(newLocalData)
    setChangedKeys(newChangedKeys)
    setSelectedAddons(newSelectedAddons)
    toast.success('Settings copied')
    setDialogVisible(false)
  }

  //
  // Render
  //

  // TODO: implement copy selected

  const footer = (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Spacer />
      <Button label="Copy selected" icon="rule" disabled onClick={() => doTheMagic(true)} />
      <Button
        label="Copy all settings"
        icon="checklist"
        variant="filled"
        onClick={() => doTheMagic()}
        disabled={!nodes.length}
      />
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
          header={`Copy settings`}
          visible
          onHide={() => setDialogVisible(false)}
          style={{ width: '80%', height: '80%' }}
          footer={footer}
        >
          <DialogBody>
            <ToolPanel>
              <ToolSection>
                <Toolbar>
                  Source bundle
                  <BundleDropdown bundleName={sourceBundle} setBundleName={setSourceBundle} />
                  <VariantSelector variant={sourceVariant} setVariant={setSourceVariant} />
                </Toolbar>

                {projectName && (
                  <Toolbar>
                    Source project
                    <ProjectDropdown
                      projectName={sourceProjectName}
                      setProjectName={setSourceProjectName}
                    />
                  </Toolbar>
                )}
              </ToolSection>

              <ToolSectionSeparator>
                <Icon icon="trending_flat" />
              </ToolSectionSeparator>

              <ToolSection>
                <Toolbar>
                  Target bundle
                  <BundleDropdown bundleName={bundleName} setBundleName={() => {}} disabled />
                  <VariantSelector variant={variant} setVariant={() => {}} disabled />
                </Toolbar>
                {projectName && (
                  <Toolbar>
                    Target project
                    <ProjectDropdown projectName={projectName} setProjectName={() => {}} disabled />
                  </Toolbar>
                )}
              </ToolSection>
            </ToolPanel>
            <CopySettingsTable
              sourceBundle={sourceBundle}
              sourceVariant={sourceVariant}
              sourceProjectName={sourceProjectName}
              targetBundle={bundleName}
              targetVariant={variant}
              targetProjectName={projectName}
              nodes={nodes}
              setNodes={setNodes}
            />
          </DialogBody>
        </Dialog>
      )}
    </>
  )
}

export default CopySettingsButton
