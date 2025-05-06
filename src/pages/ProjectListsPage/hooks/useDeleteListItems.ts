import { TableActionConstructor } from '@pages/ProjectOverviewPage/components/OverviewActions'
import { useUpdateEntityListItemsMutation } from '@queries/lists/updateLists'
import { ContextMenuItemConstructor } from '@shared/containers/ProjectTreeTable/hooks/useCellContextMenu'
import { parseCellId } from '@shared/containers/ProjectTreeTable/utils/cellUtils'
import { confirmDelete, getPlatformShortcutKey, KeyMode } from '@shared/util'
import { ConfirmDialogReturn } from 'primereact/confirmdialog'
import { toast } from 'react-toastify'

type UseDeleteListItemsProps = {
  projectName: string
  listId?: string
}

type DeleteListItems = (itemIds: string[], force?: boolean) => Promise<void>
type DeleteListItemsWithConfirmation = (itemIds: string[]) => Promise<ConfirmDialogReturn>

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
}: UseDeleteListItemsProps): UseDeleteListItemsReturn => {
  const [updateEntityListItems] = useUpdateEntityListItemsMutation()

  const onDeleteListItems: DeleteListItems = async (itemIds) => {
    try {
      if (!listId) throw { data: { detail: 'No listId provided' } }

      const items = itemIds.map((item) => ({ id: item }))

      await updateEntityListItems({
        projectName,
        listId: listId,
        entityListMultiPatchModel: {
          items,
          mode: 'delete',
        },
      }).unwrap()

      toast.success(`Deleted ${items.length} item${items.length > 1 ? 's' : ''} from list`)
    } catch (error: any) {
      console.error('Error deleting list items:', error)
      // Handle the error (e.g., show a toast notification)
      toast.error(`Error deleting list items: ${error.data.detail}`)
    }
  }

  const deleteListItemsWithConfirmation: DeleteListItemsWithConfirmation = async (itemIds) =>
    confirmDelete({
      label: `remove ${itemIds.length} item${itemIds.length > 1 ? 's' : ''} from list`,
      deleteLabel: 'Remove',
      accept: async () => onDeleteListItems(itemIds),
      showToasts: false,
    })

  const deleteListItems: DeleteListItems = async (itemIds, force) => {
    if (force) {
      await onDeleteListItems(itemIds)
    } else {
      await deleteListItemsWithConfirmation(itemIds)
    }
  }

  const deleteListItemMenuItem: ContextMenuItemConstructor = (_e, _cell, selectedCells) => ({
    label: deleteItemLabel.label,
    icon: deleteItemLabel.icon,
    shortcut: deleteItemLabel.shortcut,
    danger: true,
    command: async () => {
      const selectedListItems = selectedCells
        .map((cell) => parseCellId(cell.cellId)?.rowId)
        .filter(Boolean)

      await deleteListItemsWithConfirmation(selectedListItems as string[])
    },
  })

  const deleteListItemAction: TableActionConstructor = (selection) => ({
    icon: deleteItemLabel.icon,
    ['data-tooltip']: deleteItemLabel.label,
    ['data-shortcut']: deleteItemLabel.shortcut,
    disabled: !selection.selectedCells.size,
    onClick: () => {
      // convert selection to a list of ids
      const selectedListItems = Array.from(selection.selectedCells)
        .map((cell) => parseCellId(cell)?.rowId)
        .filter(Boolean)
      deleteListItemsWithConfirmation(selectedListItems as string[])
    },
  })

  return {
    deleteListItems,
    deleteListItemMenuItem,
    deleteListItemAction,
  }
}

export default useDeleteListItems
