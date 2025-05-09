import { useCallback, useMemo } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'

import { Icon, TablePanel } from '@ynput/ayon-react-components'

import { useCreateContextMenu } from '@shared/containers/ContextMenu'
import styled from 'styled-components'
import clsx from 'clsx'
import useTableLoadingData from '@hooks/useTableLoadingData'

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: var(--base-gap-small);

  [icon='check'] {
    display: inline-block !important;
    width: 100%;
    text-align: center;
    height: 20px;
  }
`

const PresetList = ({
  selectedPreset,
  setSelectedPreset,
  onSetPrimary,
  onDelete,
  onRename,
  presetList,
  isLoading,
}) => {
  const getCtxMenuItems = useCallback(
    (data = {}) => {
      // empty string is default preset
      const isDefault = !('primary' in data)
      const isBuiltIn = data.name === '_'
      console.log(data)

      const items = [
        {
          label: 'Set as primary',
          icon: 'flag',
          command: () => onSetPrimary(isDefault ? '_' : data.name),
          disabled: data.primary || isDefault || isBuiltIn,
        },
        {
          label: 'Rename',
          icon: 'edit',
          disabled: isDefault || isBuiltIn,
          command: () => onRename(data.name),
        },
        {
          label: 'Delete',
          icon: 'delete',
          disabled: isDefault || isBuiltIn,
          command: () => onDelete(data.name, data.primary),
          danger: true,
        },
      ]

      return items
    },
    [selectedPreset, presetList, onDelete, onSetPrimary],
  )

  const ctxMenuItems = useMemo(() => getCtxMenuItems(), [])

  const [ctxMenuShow] = useCreateContextMenu(ctxMenuItems)
  // add built-in presets to the start of the list
  let presetListWithBuiltIn = useMemo(() => {
    const noPrimary = presetList.every((preset) => !preset.primary)
    return [
      {
        name: '_',
        label: 'AYON default (read only)',
        primary: noPrimary,
      },
      ...presetList.map((preset) => ({
        ...preset,
        label: preset.name,
      })),
    ]
  }, [presetList])

  const tableData = useTableLoadingData(presetListWithBuiltIn, isLoading, 6, 'name')

  return (
    <StyledContainer>
      <TablePanel>
        <DataTable
          value={tableData}
          scrollable
          scrollHeight="flex"
          selectionMode="single"
          responsive="true"
          dataKey="name"
          selection={{ name: selectedPreset }}
          onSelectionChange={(e) => setSelectedPreset(e.value.name)}
          onContextMenuSelectionChange={(e) => setSelectedPreset(e.value.name)}
          onContextMenu={(e) => ctxMenuShow(e.originalEvent, getCtxMenuItems(e.data))}
          className={clsx({ loading: isLoading })}
          rowClassName={(data) => clsx({ default: data.primary, loading: isLoading })}
        >
          <Column field="label" header="Name" />
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
