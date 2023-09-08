/* eslint-disable */

import { useState } from 'react'
import { ScrollPanel, Icon } from '@ynput/ayon-react-components'

import { Dialog } from 'primereact/dialog'
import styled from 'styled-components'

import VariantSelector from '/src/containers/AddonSettings/VariantSelector'
import ProjectDropdown from '/src/containers/CopySettings/ProjectDropdown'

const NodePanelWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flexgrow: 1;
  min-height: 150px;
  border: 1px solid #ccc;
`

const NodePanelHeader = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid red;
`

const NodePanelDirectionSelector = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-grow: 1;

  .icon {
    font-size: 4rem;
    border-radius: var(--border-radius-m);
    user-select: none;
  }
`

const CopySettingsNode = ({
  addonName,
  targetVersion,
  targetVariant,
  targetProjectName,

  nodeData,
  setNodeData,
}) => {
  const [sourceVersion, setSourceVersion] = useState(null)
  const [sourceVariant, setSourceVariant] = useState(null)
  const [sourceProjectName, setSourceProjectName] = useState(null)

  const header = (
    <NodePanelHeader>
      <VariantSelector variant={sourceVariant} setVariant={setSourceVariant} />

      <NodePanelDirectionSelector>
        <Icon icon="trending_flat" />
      </NodePanelDirectionSelector>

      <VariantSelector variant={targetVariant} setVariant={() => {}} disabled={true} />
    </NodePanelHeader>
  )

  return (
    <NodePanelWrapper>
      {header}
      List of changes here
    </NodePanelWrapper>
  )
}

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
}) => {
  const [nodes, setNodes] = useState([])

  return (
    <Dialog
      visible
      onHide={onClose}
      style={{ width: '80vw', height: '80vh' }}
      header="Copy Settings"
    >
      <ScrollPanel style={{ width: '100%', height: '100%', gap: 8, background: 'transparent' }}>
        {selectedAddons.map((addon) => (
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
          />
        ))}
      </ScrollPanel>
    </Dialog>
  )
}

export default CopySettingsDialog
