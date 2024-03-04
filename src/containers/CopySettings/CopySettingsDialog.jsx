/* eslint-disable */

import { useState, useMemo } from 'react'
import { toast } from 'react-toastify'

import { ScrollPanel, Button, Spacer, Toolbar } from '@ynput/ayon-react-components'

import BundleDropdown from '/src/containers/BundleDropdown'
import ProjectDropdown from '/src/containers/ProjectDropdown'
import VariantSelector from '/src/containers/AddonSettings/VariantSelector'

import { Dialog } from 'primereact/dialog'
import CopySettingsNode from './CopySettingsNode'

import { setValueByPath } from '../AddonSettings/utils'
import { useGetBundleListQuery } from '/src/services/bundles'
import { cloneDeep } from 'lodash'

const CopySettingsDialog = ({
  selectedAddons,
  variant,
  originalData,
  setOriginalData,
  localData,
  setLocalData,
  changedKeys,
  setChangedKeys,
  projectName,
  onClose,
  pickByBundle = false,
}) => {
  const [nodes, setNodes] = useState([])

  const [sourceBundle, setSourceBundle] = useState(null)
  const [sourceVariant, setSourceVariant] = useState(null)
  const [sourceProjectName, setSourceProjectName] = useState(null)

  const {
    data: bundlesData,
    isLoading: bundlesLoading,
    isError: bundlesError,
  } = useGetBundleListQuery({}, { skip: !pickByBundle })

  const sourceVersions = useMemo(() => {
    if (bundlesLoading || bundlesError) return {}
    if (!sourceBundle) return {}

    const sb = bundlesData.find((i) => i.name === sourceBundle)
    return sb?.addons || {}
  }, [sourceBundle, bundlesData, bundlesLoading, bundlesError])

  const doTheMagic = () => {
    const newLocalData = cloneDeep(localData)
    const newChangedKeys = { ...changedKeys }
    const newOriginalData = { ...originalData }
    const newSelectedAddons = []

    for (const nodeKey in nodes) {
      const node = nodes[nodeKey]
      if (!(node.available && node.enabled)) continue
      console.log('Migrating node', node.addonName, node.addonVersion)

      // Define the target addon
      const siteId = '_'
      const projectKey = projectName || '_'
      const key = `${node.addonName}|${node.targetAddonVersion}|${variant}|${siteId}|${projectKey}`
      const addon = {
        name: node.addonName,
        version: node.targetAddonVersion,
        variant: variant,
        siteId,
        key,
      }

      const addonOverrides = []
      let addonSettings = cloneDeep(node.targetSettings.data)
      newOriginalData[key] = cloneDeep(node.targetSettings.data)

      // Iterate over the changes and apply them to the target addon

      for (const change of node.changes) {
        if (!change.enabled) continue
        const value = cloneDeep(change.sourceValue)
        addonSettings = setValueByPath(addonSettings, change.path, value)
        addonOverrides.push(change.path)
      } // for change of node.children

      newLocalData[key] = addonSettings
      newChangedKeys[key] = addonOverrides
      newSelectedAddons.push(addon)
    } // for node of nodes

    setOriginalData(newOriginalData)
    setLocalData(newLocalData)
    setChangedKeys(newChangedKeys)
    //setSelectedAddons(newSelectedAddons)
    toast.success('Settings copied')
    onClose(false)
  }

  const somethingToCopy = useMemo(() => {
    // Do we have something to copy?
    // Is there at least one change enabled?
    for (const nodeKey in nodes || {}) {
      const node = nodes[nodeKey]
      for (const change of node.changes || []) {
        if (change?.enabled) return true
      }
    }
    return false
  }, [nodes])

  //
  // RENDER
  //

  const footer = (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Spacer />
      <Button
        label="Copy selected settings"
        icon="checklist"
        variant="filled"
        onClick={() => doTheMagic()}
        disabled={!somethingToCopy}
      />
    </div>
  )

  const toolbar = pickByBundle && (
    <Toolbar>
      <BundleDropdown
        style={{ flexGrow: 1 }}
        bundleName={sourceBundle}
        setBundleName={setSourceBundle}
      />
      <VariantSelector variant={sourceVariant} setVariant={setSourceVariant} />
      {projectName && (
        <ProjectDropdown projectName={sourceProjectName} setProjectName={setSourceProjectName} />
      )}
      <Spacer />
    </Toolbar>
  )

  return (
    <Dialog
      visible
      onHide={onClose}
      style={{ width: '80vw', height: '80vh' }}
      header={`Copy ${variant} settings ${pickByBundle ? 'by bundle' : ''}`}
      footer={footer}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          width: '100%',
          height: '100%',
        }}
      >
        {toolbar}
        <ScrollPanel style={{ flexGrow: 1, background: 'transparent' }}>
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}
          >
            {selectedAddons
              .filter((addon) => !pickByBundle || sourceVersions[addon.name])
              .map((addon) => (
                <CopySettingsNode
                  key={`${addon.name}_${addon.version}`}
                  addonName={addon.name}
                  targetVersion={addon.version}
                  targetVariant={variant}
                  targetProjectName={projectName}
                  nodeData={nodes[addon.name]}
                  setNodeData={(data) => {
                    setNodes((n) => ({
                      ...n,
                      [addon.name]: data,
                    }))
                  }}
                  forcedSourceVariant={sourceVariant}
                  forcedSourceVersion={pickByBundle ? sourceVersions[addon.name] : null}
                  forcedSourceProjectName={pickByBundle ? sourceProjectName : null}
                />
              ))}
          </div>
        </ScrollPanel>
      </div>
    </Dialog>
  )
}

export default CopySettingsDialog
