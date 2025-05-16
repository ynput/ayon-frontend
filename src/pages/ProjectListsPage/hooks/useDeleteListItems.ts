import { TableActionConstructor } from '@pages/ProjectOverviewPage/components/OverviewActions'
import { useUpdateEntityListItemsMutation } from '@shared/api'
import { ContextMenuItemConstructor } from '@shared/containers/ProjectTreeTable/hooks/useCellContextMenu'
import { UseHistoryReturn } from '@shared/containers/ProjectTreeTable/hooks/useHistory'
import { parseCellId } from '@shared/containers/ProjectTreeTable/utils/cellUtils'
import { confirmDelete, getPlatformShortcutKey, KeyMode } from '@shared/util'
import { ConfirmDialogReturn } from 'primereact/confirmdialog'
import { toast } from 'react-toastify'
import { ListItemsDataContextValue } from '../context/ListItemsDataContext'

type UseDeleteListItemsProps = {
  projectName: string
  listId?: string
  listItemsMap: ListItemsDataContextValue['listItemsMap']
}

export type DeleteListItem = { id: string; entityId: string }

type OnDeleteListItems = (items: DeleteListItem[], history?: UseHistoryReturn) => Promise<void>
type DeleteListItems = (
  items: DeleteListItem[],
  history?: UseHistoryReturn,
  force?: boolean,
) => Promise<void>
type DeleteListItemsWithConfirmation = (
  items: DeleteListItem[],
  history?: UseHistoryReturn,
) => Promise<ConfirmDialogReturn>

export type UseDeleteListItemsReturn = {
  deleteListItems: DeleteListItems
  deleteListItemMenuItem: ContextMenuItemConstructor
  deleteListItemAction: TableActionConstructor
}

const deleteItemLabel = {
  icon: 'remove',
  label: 'Remove from list',
  shortcut: getPlatformShortcutKey('Backspace', [KeyMode.Ctrl]),
}

const useDeleteListItems = ({
  projectName,
  listId,
  listItemsMap,
}: UseDeleteListItemsProps): UseDeleteListItemsReturn => {
  const [updateEntityListItems] = useUpdateEntityListItemsMutation()

  // This is used to undo the delete action
  const addItemsBackToList = async (items: DeleteListItem[], history?: UseHistoryReturn) => {
    try {
      if (!listId) throw { data: { detail: 'No listId provided' } }

      await updateEntityListItems({
        projectName,
        listId: listId,
        entityListMultiPatchModel: {
          items,
          mode: 'merge',
        },
      }).unwrap()
    } catch (error: any) {
      toast.error(`Error adding items to list: ${error.data.detail}`)
      // remove from redo stack as well
      if (history) {
        history.removeHistoryEntries(1)
      }
    }
  }

  const onDeleteListItems: OnDeleteListItems = async (items, history) => {
    try {
      if (!listId) throw { data: { detail: 'No listId provided' } }

      await updateEntityListItems({
        projectName,
        listId: listId,
        entityListMultiPatchModel: {
          items,
          mode: 'delete',
        },
      }).unwrap()

      // if there is a history, push it
      if (history) {
        history.pushHistory([() => addItemsBackToList(items)], [() => onDeleteListItems(items)])
      }

      toast.success(`Deleted ${items.length} item${items.length > 1 ? 's' : ''} from list`)
    } catch (error: any) {
      console.error('Error deleting list items:', error)
      // Handle the error (e.g., show a toast notification)
      toast.error(`Error deleting list items: ${error.data.detail}`)
    }
  }

  const deleteListItemsWithConfirmation: DeleteListItemsWithConfirmation = async (
    itemIds,
    history,
  ) =>
    confirmDelete({
      label: `remove ${itemIds.length} item${itemIds.length > 1 ? 's' : ''} from list`,
      deleteLabel: 'Remove',
      accept: async () => onDeleteListItems(itemIds, history),
      showToasts: false,
    })

  const deleteListItems: DeleteListItems = async (itemIds, history, force) => {
    if (force) {
      await onDeleteListItems(itemIds, history)
    } else {
      await deleteListItemsWithConfirmation(itemIds, history)
    }
  }

  // CONTEXT MENU DELETE
  const deleteListItemMenuItem: ContextMenuItemConstructor = (
    _e,
    _cell,
    selectedCells,
    _meta,
    context,
  ) => ({
    label: deleteItemLabel.label,
    icon: deleteItemLabel.icon,
    shortcut: deleteItemLabel.shortcut,
    danger: true,
    command: async () => {
      const selectedListItems = selectedCells
        .filter((cell) => parseCellId(cell.cellId)?.rowId)
        .map((cell) => ({ id: parseCellId(cell.cellId)?.rowId as string, entityId: cell.entityId }))

      await deleteListItemsWithConfirmation(selectedListItems, context.history)
    },
  })

  // ACTIONS BUTTON DELETE
  const deleteListItemAction: TableActionConstructor = (selection, editing) => ({
    icon: deleteItemLabel.icon,
    ['data-tooltip']: deleteItemLabel.label,
    ['data-shortcut']: deleteItemLabel.shortcut,
    disabled: !selection.selectedCells.size,
    onClick: () => {
      // convert selection to a list of ids
      const selectedListItems: DeleteListItem[] = []

      Array.from(selection.selectedCells).forEach((cell) => {
        const itemId = parseCellId(cell)?.rowId
        if (!itemId) return
        const entityId = listItemsMap.get(itemId)?.entityId
        if (!entityId) return
        selectedListItems.push({ id: itemId, entityId })
      })
      deleteListItemsWithConfirmation(selectedListItems, editing.history)
    },
  })

  return {
    deleteListItems,
    deleteListItemMenuItem,
    deleteListItemAction,
  }
}

export default useDeleteListItems
