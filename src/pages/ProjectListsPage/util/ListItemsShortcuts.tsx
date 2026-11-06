import {
  ROW_SELECTION_COLUMN_ID,
  useCellEditing,
  useSelectionCellsContext,
} from '@shared/containers/ProjectTreeTable'
import { FC, useEffect } from 'react'
import { toast } from 'react-toastify'
import { useListItemsDataContext } from '../context/list-items-data'
import { parseCellId } from '@shared/containers/ProjectTreeTable/utils/cellUtils'
import { DeleteListItem } from '../hooks/useDeleteListItems'
import { isEntityRestricted } from '@shared/containers/ProjectTreeTable/utils/restrictedEntity'
import { useListsContext } from '../context'

interface ListTableShortcutsProps {}

const ListItemsShortcuts: FC<ListTableShortcutsProps> = ({}) => {
  const { selectedCells } = useSelectionCellsContext()
  const { deleteListItems, listItemsMap } = useListItemsDataContext()
  const { selectedList } = useListsContext()
  const { history } = useCellEditing()
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if user has editor permissions (accessLevel >= 20)
      if ((selectedList?.accessLevel ?? 0) < 20) return

      if (event.key === 'Backspace' && (event.ctrlKey || event.metaKey)) {
        // convert the selected cells to a list of ids; row checkboxes are ignored, as in context menus
        const selectedListItems: DeleteListItem[] = []
        let hasCellSelection = false

        Array.from(selectedCells).forEach((cell) => {
          const parsed = parseCellId(cell)
          if (!parsed || parsed.colId === ROW_SELECTION_COLUMN_ID) return
          hasCellSelection = true
          const itemId = parsed.rowId
          if (!itemId) return
          const item = listItemsMap.get(itemId)
          if (!item) return
          // Skip restricted entities
          if (isEntityRestricted(item.entityType)) return
          selectedListItems.push({ id: itemId, entityId: item.entityId })
        })

        // rows selected only by their checkbox are not removed, so tell the user to select cells
        if (!hasCellSelection) {
          toast.warning(
            'Select some cells to remove. Rows selected with the checkbox are not included.',
          )
          return
        }

        // Only delete if there are non-restricted items
        if (selectedListItems.length > 0) {
          deleteListItems(selectedListItems, history, true)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedCells, deleteListItems, history, listItemsMap, selectedList?.accessLevel])
  return null
}

export default ListItemsShortcuts
