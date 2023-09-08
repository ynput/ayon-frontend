/* eslint-disable */

import { useState } from 'react'
import { ScrollPanel } from '@ynput/ayon-react-components'
import { Dialog } from 'primereact/dialog'

import CopySettingsNode from './CopySettingsNode'

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
      <ScrollPanel style={{ width: '100%', height: '100%', background: 'transparent' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
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
        </div>
      </ScrollPanel>
    </Dialog>
  )
}

export default CopySettingsDialog
