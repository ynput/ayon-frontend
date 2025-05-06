import { useSelectionContext } from '@shared/containers/ProjectTreeTable'
import { FC, useEffect } from 'react'
import { useListItemsDataContext } from '../context/ListItemsDataContext'
import { parseCellId } from '@shared/containers/ProjectTreeTable/utils/cellUtils'

interface ListTableShortcutsProps {}

const ListItemsShortcuts: FC<ListTableShortcutsProps> = ({}) => {
  const { selectedCells } = useSelectionContext()
  const { deleteListItems } = useListItemsDataContext()
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Backspace' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault()
        const selectedListItems = Array.from(selectedCells)
          .map((cell) => parseCellId(cell)?.rowId)
          .filter(Boolean)

        deleteListItems(selectedListItems as string[])
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedCells, deleteListItems])
  return null
}

export default ListItemsShortcuts
