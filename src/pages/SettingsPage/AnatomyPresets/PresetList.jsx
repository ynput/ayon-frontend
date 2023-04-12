import { useMemo, useRef } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { ContextMenu } from 'primereact/contextmenu'

import { TablePanel } from 'ayon-react-components-test'

import { useGetAnatomyPresetsQuery } from '../../../services/anatomy/getAnatomy'

const PresetList = ({
  selectedPreset,
  setSelectedPreset,
  onSetPrimary,
  onUnsetPrimary,
  onDelete,
}) => {
  const contextMenuRef = useRef(null)

  // get presets lists data
  const { data: presetList = [], isLoading } = useGetAnatomyPresetsQuery()

  const contextMenuModel = useMemo(() => {
    return [
      {
        label: 'Set as primary',
        command: onSetPrimary,
      },
      {
        label: 'Unset primary preset',
        command: onUnsetPrimary,
      },
      {
        label: 'Delete',
        disabled: selectedPreset === '_',
        command: onDelete,
      },
    ]
  }, [selectedPreset, presetList])

  return (
    <TablePanel loading={isLoading}>
      <ContextMenu model={contextMenuModel} ref={contextMenuRef} />
      <DataTable
        value={presetList}
        scrollable
        scrollHeight="flex"
        selectionMode="single"
        responsive="true"
        dataKey="name"
        selection={{ name: selectedPreset }}
        onSelectionChange={(e) => setSelectedPreset(e.value.name)}
        onContextMenuSelectionChange={(e) => setSelectedPreset(e.value.name)}
        onContextMenu={(e) => contextMenuRef.current.show(e.originalEvent)}
      >
        <Column field="title" header="Name" />
        <Column field="primary" header="Primary" style={{ maxWidth: 70 }} />
        <Column field="version" header="Version" style={{ maxWidth: 80 }} />
      </DataTable>
    </TablePanel>
  )
}

export default PresetList
