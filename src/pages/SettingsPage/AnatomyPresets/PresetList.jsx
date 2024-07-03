import { useCallback, useMemo } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'

import { TablePanel } from '@ynput/ayon-react-components'

import useCreateContext from '@hooks/useCreateContext'

const PresetList = ({
  selectedPreset,
  setSelectedPreset,
  onSetPrimary,
  onDelete,
  presetList,
  isLoading,
}) => {
  const getCtxMenuItems = useCallback(
    (data = {}) => {
      // empty string is default preset
      const isDefault = !('primary' in data)
      const primarySelected = data.primary === 'PRIMARY'

      const items = [
        {
          label: 'Set as primary',
          icon: 'flag',
          command: () => onSetPrimary(isDefault ? '_' : data.name),
          disabled: primarySelected || isDefault,
        },
        {
          label: 'Delete',
          icon: 'delete',
          disabled: isDefault,
          command: () => onDelete(data.name, primarySelected),
          danger: true,
        },
      ]

      return items
    },
    [selectedPreset, presetList, onDelete, onSetPrimary],
  )

  const ctxMenuItems = useMemo(() => getCtxMenuItems(), [])

  const [ctxMenuShow] = useCreateContext(ctxMenuItems)

  return (
    <TablePanel loading={isLoading}>
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
        onContextMenu={(e) => ctxMenuShow(e.originalEvent, getCtxMenuItems(e.data))}
      >
        <Column field="title" header="Name" />
        <Column field="primary" header="Primary" style={{ maxWidth: 70 }} />
        <Column field="version" header="Version" style={{ maxWidth: 80 }} />
      </DataTable>
    </TablePanel>
  )
}

export default PresetList
