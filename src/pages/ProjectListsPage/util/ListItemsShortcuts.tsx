import { useCellEditing, useSelectionContext } from '@shared/containers/ProjectTreeTable'
import { FC, useEffect } from 'react'
import { useListItemsDataContext } from '../context/ListItemsDataContext'
import { parseCellId } from '@shared/containers/ProjectTreeTable/utils/cellUtils'
import { DeleteListItem } from '../hooks/useDeleteListItems'

interface ListTableShortcutsProps {}

const ListItemsShortcuts: FC<ListTableShortcutsProps> = ({}) => {
  const { selectedCells } = useSelectionContext()
  const { deleteListItems, listItemsMap } = useListItemsDataContext()
  const { history } = useCellEditing()
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Backspace' && (event.ctrlKey || event.metaKey)) {
        // convert selection to a list of ids
        const selectedListItems: DeleteListItem[] = []

        Array.from(selectedCells).forEach((cell) => {
          const itemId = parseCellId(cell)?.rowId
          if (!itemId) return
          const entityId = listItemsMap.get(itemId)?.entityId
          if (!entityId) return
          selectedListItems.push({ id: itemId, entityId })
        })
        deleteListItems(selectedListItems, history, true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedCells, deleteListItems, history, listItemsMap])
  return null
}

export default ListItemsShortcuts
