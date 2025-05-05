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

type DeleteListItems = (itemIds: string[]) => Promise<void>
type DeleteListItemsWithConfirmation = (itemIds: string[]) => Promise<ConfirmDialogReturn>

export type UseDeleteListItemsReturn = {
  deleteListItems: DeleteListItems
  deleteListItemsWithConfirmation: DeleteListItemsWithConfirmation
  deleteListItemMenuItem: ContextMenuItemConstructor
}

const useDeleteListItems = ({
  projectName,
  listId,
}: UseDeleteListItemsProps): UseDeleteListItemsReturn => {
  const [updateEntityListItems] = useUpdateEntityListItemsMutation()

  const deleteListItems: DeleteListItems = async (itemIds) => {
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
      accept: async () => deleteListItems(itemIds),
    })

  const deleteListItemMenuItem: ContextMenuItemConstructor = (_e, _cell, selectedCells) => ({
    label: 'Remove from list',
    icon: 'close',
    danger: true,
    shortcut: getPlatformShortcutKey('Backspace', [KeyMode.Ctrl]),
    command: async () => {
      const selectedListItems = selectedCells
        .map((cell) => parseCellId(cell.cellId)?.rowId)
        .filter(Boolean)

      await deleteListItemsWithConfirmation(selectedListItems as string[])
    },
  })

  return {
    deleteListItems,
    deleteListItemsWithConfirmation,
    deleteListItemMenuItem,
  }
}

export default useDeleteListItems
