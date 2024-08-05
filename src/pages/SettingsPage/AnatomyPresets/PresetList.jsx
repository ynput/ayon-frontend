import { useCallback, useMemo } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'

import { Button, Icon, TablePanel } from '@ynput/ayon-react-components'

import useCreateContext from '@hooks/useCreateContext'
import styled from 'styled-components'

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: var(--base-gap-small);

  [icon='check'] {
    display: inline-block !important;
    width: 100%;
    text-align: center;
  }
`

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

  const defaultPreset = presetList.find((preset) => preset.primary)

  return (
    <StyledContainer>
      <Button
        onClick={() => defaultPreset && setSelectedPreset(defaultPreset?.name)}
        disabled={!defaultPreset}
      >
        Primary: {defaultPreset?.name || 'System Default'}
      </Button>
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
          <Column field="name" header="Name" />
          <Column field="version" header="Version" style={{ maxWidth: 80 }} />
          <Column
            field="primary"
            header="Primary"
            style={{ maxWidth: 50 }}
            body={(data) => (data?.primary ? <Icon icon={'check'} /> : '')}
          />
        </DataTable>
      </TablePanel>
    </StyledContainer>
  )
}

export default PresetList
