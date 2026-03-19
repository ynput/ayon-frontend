import { getPlatformShortcutKey, KeyMode } from '@shared/util'
import {
  CellEditingContextType,
  parseCellId,
  ROW_SELECTION_COLUMN_ID,
  SelectionCellsContextType,
  useCellEditing,
  useSelectionCellsContext,
} from '@shared/containers/ProjectTreeTable'
import useDeleteEntities from '@shared/containers/ProjectTreeTable/hooks/useDeleteEntities'
import { Button, ButtonProps } from '@ynput/ayon-react-components'
import { FC } from 'react'
import styled from 'styled-components'

const Container = styled.div`
  display: flex;
  gap: var(--base-gap-small);

  background-color: var(--md-sys-color-surface-container-high);
  padding: 2px;
  border-radius: var(--border-radius-m);
`
const ActionButton = styled(Button)`
  &.action {
    background-color: unset;
    padding: 4px;
    &:disabled {
      opacity: 0.2;
      cursor: default;
      &:hover {
        background-color: unset;
      }
    }

    &:hover {
      background-color: var(--md-sys-color-surface-container-high-hover) !important;
      display: flex;
    }
  }
`
export type ActionType = 'undo' | 'redo' | 'delete'
interface ActionItem extends ButtonProps {
  ['data-tooltip']?: string
  ['data-shortcut']?: string
}

export type TableActionConstructor = (
  selection: SelectionCellsContextType,
  editing: CellEditingContextType,
) => ActionItem

interface OverviewActionsProps {
  items?: (TableActionConstructor | ActionType)[]
}

const OverviewActions: FC<OverviewActionsProps> = ({ items }) => {
  const selection = useSelectionCellsContext()
  const { selectedCells } = selection
  const editing = useCellEditing()
  const { history, undo, redo } = editing
  const { canUndo, canRedo } = history
  const deleteEntities = useDeleteEntities({})

  // find which entities are selected (removing duplicates and row_selection)
  const selectedEntities: string[] = []
  Array.from(selectedCells).forEach((cellId) => {
    const { rowId, colId } = parseCellId(cellId) || {}
    if (!rowId || selectedEntities.includes(rowId) || colId === ROW_SELECTION_COLUMN_ID) return
    selectedEntities.push(rowId)
  })

  const builtInActions: Record<ActionType, ActionItem> = {
    undo: {
      icon: 'undo',
      ['data-tooltip']: 'Undo',
      ['data-shortcut']: getPlatformShortcutKey('z', [KeyMode.Ctrl]),
      onClick: undo,
      disabled: !canUndo,
    },
    redo: {
      icon: 'redo',
      ['data-tooltip']: 'Redo',
      ['data-shortcut']: getPlatformShortcutKey('z', [KeyMode.Ctrl], 'Shift'),
      onClick: redo,
      disabled: !canRedo,
    },
    delete: {
      icon: 'delete',
      ['data-tooltip']: 'Delete selected',
      onClick: () => deleteEntities(selectedEntities),
      disabled: !selectedEntities.length,
    },
  }

  // First build the list of action configs
  const actionConfigs: { item: ActionItem; key: React.Key }[] = items?.length
    ? items.map((item, index) => ({
        item: typeof item === 'string' ? builtInActions[item] : item(selection, editing),
        key: index,
      }))
    : Object.entries(builtInActions).map(([key, item]) => ({
        item,
        key,
      }))

  return (
    <Container>
      {actionConfigs.map(({ item, key }) => (
        <ActionButton
          key={key}
          icon={item.icon}
          data-tooltip={item['data-tooltip']}
          data-shortcut={item['data-shortcut']}
          onClick={item.onClick}
          disabled={item.disabled}
          className="action"
        />
      ))}
    </Container>
  )
}

export default OverviewActions
