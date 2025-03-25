/* eslint-disable */

import { useState, useMemo } from 'react'
import { toast } from 'react-toastify'
import styled from 'styled-components'

import { ScrollPanel, Button, Spacer, Toolbar, Dialog } from '@ynput/ayon-react-components'

import BundleDropdown from '@containers/BundleDropdown'
import ProjectDropdown from '@containers/ProjectDropdown'
import VariantSelector from '@containers/AddonSettings/VariantSelector'

import CopySettingsNode from './CopySettingsNode'

import { setValueByPath } from '../AddonSettings/utils'
import { useListBundlesQuery } from '@queries/bundles/getBundles'
import { cloneDeep } from 'lodash'

const StateShade = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #252a31;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  font-weight: bold;
  color: #666;
`

const CopySettingsDialog = ({
  selectedAddons,
  variant,
  originalData,
  setOriginalData,
  localData,
  setLocalData,
  changedKeys,
  unpinnedKeys,
  setChangedKeys,
  setUnpinnedKeys,
  projectName,
  onClose,
  pickByBundle = false,
}) => {
  const [nodes, setNodes] = useState([])

  const [sourceBundle, setSourceBundle] = useState(null)
  const [sourceVariant, setSourceVariant] = useState(null)
  const [sourceProjectName, setSourceProjectName] = useState(projectName)
  const [nodeState, setNodeState] = useState({})

  const {
    data: { bundles = [] } = {},
    isLoading: bundlesLoading,
    isError: bundlesError,
  } = useListBundlesQuery({})

  const sourceVersions = useMemo(() => {
    if (!sourceBundle) return {}

    if (bundlesLoading || bundlesError) return {}

    if (!bundles) return {}

    const sb = bundles.find((i) => i.name === sourceBundle)
    return sb?.addons || {}
  }, [sourceBundle, bundles, bundlesLoading, bundlesError])

  const doTheMagic = () => {
    const newLocalData = cloneDeep(localData)
    const newChangedKeys = { ...changedKeys }
    const newUnpinnedKeys = { ...setUnpinnedKeys }
    const newOriginalData = { ...originalData }
    const newSelectedAddons = []

    for (const nodeKey in nodes) {
      const node = nodes[nodeKey]
      if (!(node.available && node.enabled)) continue
      //console.log('Migrating node', node.addonName, node.addonVersion)

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
      const addonUnpins = []
      let addonSettings = cloneDeep(node.targetSettings.data)
      newOriginalData[key] = cloneDeep(node.targetSettings.data)

      // Iterate over the changes and apply them to the target addon

      for (const change of node.changes) {
        if (!change.enabled) continue
        const value = cloneDeep(change.copyValue)
        addonSettings = setValueByPath(addonSettings, change.path, value)
        addonOverrides.push(change.path)

        if (change.targetLevel === 'studio' && change.sourceLevel === 'default') {
          addonUnpins.push(change.path)
        }
        if (
          change.targetLevel === 'project' &&
          ['studio', 'default'].includes(change.sourceLevel)
        ) {
          addonUnpins.push(change.path)
        }
      } // for change of node.children

      newLocalData[key] = addonSettings
      newChangedKeys[key] = addonOverrides
      newUnpinnedKeys[key] = addonUnpins
      newSelectedAddons.push(addon)
    } // for node of nodes

    setOriginalData(newOriginalData)
    setLocalData(newLocalData)
    setChangedKeys(newChangedKeys)
    setUnpinnedKeys(newUnpinnedKeys)
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

  const overalState = useMemo(() => {
    // get all values from nodeState and return 'loading' if any of them is 'loading'
    let somethingLoaded = false
    for (const key in nodeState) {
      if (nodeState[key] === 'loading') return 'loading'
      if (nodeState[key] === 'loaded') somethingLoaded = true
    }

    return somethingLoaded ? 'loaded' : 'empty'
  }, [nodeState])

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

  const dropSize = 270
  const dropStyle = { maxWidth: dropSize, minWidth: dropSize, marginRight: 8 }

  const toolbar = (
    <Toolbar style={{ marginBottom: 15 }}>
      {pickByBundle && (
        <>
          Source bundle:
          <BundleDropdown
            style={dropStyle}
            bundleName={sourceBundle}
            setBundleName={setSourceBundle}
            setVariant={setSourceVariant}
          />
        </>
      )}
      Source variant:
      <VariantSelector
        variant={sourceVariant}
        style={dropStyle}
        setVariant={(val) => {
          setSourceVariant(val)
        }}
      />
      <Spacer />
      {projectName && (
        <>
          Source project:
          <ProjectDropdown
            projectName={sourceProjectName}
            setProjectName={setSourceProjectName}
            style={{ ...dropStyle, marginRight: 0 }}
          />
        </>
      )}
    </Toolbar>
  )

  const dialogHeader = `Copy ${projectName ? `${projectName} ` : ''}${variant} settings from...`

  return (
    <Dialog
      isOpen
      onClose={onClose}
      variant="dialog"
      size="full"
      style={{ width: '80vw', height: '80vh', zIndex: 999 }}
      header={dialogHeader}
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
            style={{
              display: overalState === 'loading' ? 'none' : 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginBottom: '8px',
            }}
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
                  setNodeState={(state) => {
                    setNodeState((o) => ({ ...o, [addon.name]: state }))
                  }}
                  forcedSourceVariant={sourceVariant}
                  forcedSourceVersion={pickByBundle ? sourceVersions[addon.name] : null}
                  forcedSourceProjectName={sourceProjectName || null}
                />
              ))}
          </div>

          {overalState === 'loading' && <StateShade>LOADING...</StateShade>}
        </ScrollPanel>
      </div>
    </Dialog>
  )
}

export default CopySettingsDialog
