import { getPlatformShortcutKey, KeyMode } from '@shared/util'
import {
  CellEditingContextType,
  SelectionContextType,
  useCellEditing,
  useSelectionContext,
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
  background-color: unset;
  padding: 4px !important;
  &:disabled {
    opacity: 0.2;
    cursor: default;
    &:hover {
      background-color: unset;
    }
  }
`
type ActionType = 'undo' | 'redo' | 'delete'
interface ActionItem extends ButtonProps {
  ['data-tooltip']?: string
  ['data-shortcut']?: string
}

export type TableActionConstructor = (
  selection: SelectionContextType,
  editing: CellEditingContextType,
) => ActionItem

interface OverviewActionsProps {
  items?: (TableActionConstructor | ActionType)[]
}

const OverviewActions: FC<OverviewActionsProps> = ({ items }) => {
  const selection = useSelectionContext()
  const { selectedCells } = selection
  const editing = useCellEditing()
  const { canUndo, canRedo, undo, redo } = editing
  const deleteEntities = useDeleteEntities({})

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
      onClick: () => deleteEntities(Array.from(selectedCells)),
      disabled: !selectedCells.size,
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
        />
      ))}
    </Container>
  )
}

export default OverviewActions
