import { useCellEditing, useSelectionCellsContext } from '@shared/containers/ProjectTreeTable'
import { FC, useEffect } from 'react'
import { useListItemsDataContext } from '../context/ListItemsDataContext'
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
        // convert selection to a list of ids
        const selectedListItems: DeleteListItem[] = []

        Array.from(selectedCells).forEach((cell) => {
          const itemId = parseCellId(cell)?.rowId
          if (!itemId) return
          const item = listItemsMap.get(itemId)
          if (!item) return
          // Skip restricted entities
          if (isEntityRestricted(item.entityType)) return
          selectedListItems.push({ id: itemId, entityId: item.entityId })
        })

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
