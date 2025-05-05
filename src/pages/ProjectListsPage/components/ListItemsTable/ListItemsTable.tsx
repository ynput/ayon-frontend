import { useListItemsDataContext } from '@pages/ProjectListsPage/context/ListItemsDataContext'
import { useListsContext } from '@pages/ProjectListsPage/context/ListsContext'
import { getColumnConfigFromType } from '@pages/ProjectListsPage/util'
import { EmptyPlaceholder } from '@shared/components'
import { ProjectTreeTable, useSelectionContext } from '@shared/containers/ProjectTreeTable'
import { parseCellId } from '@shared/containers/ProjectTreeTable/utils/cellUtils'
import { FC, useEffect } from 'react'

interface ListItemsTableProps {}

const ListItemsTable: FC<ListItemsTableProps> = ({}) => {
  const { rowSelection, selectedList } = useListsContext()
  const selectedListsIds = Object.entries(rowSelection).filter(([_, isSelected]) => isSelected)
  const isMultipleSelected = selectedListsIds.length > 1
  const { isError, projectName, fetchNextPage, deleteListItems } = useListItemsDataContext()
  const scope = `lists-${projectName}`

  const [hiddenColumns, readOnly] = getColumnConfigFromType(selectedList?.entityType)

  //   create shortcut to delete items
  const { selectedCells } = useSelectionContext()
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

  if (!selectedListsIds.length) return <EmptyPlaceholder message="Start by selecting a list." />

  if (isMultipleSelected)
    return <EmptyPlaceholder message="Please select one list to view its items." />

  if (isError) return <EmptyPlaceholder message="Error loading list items." />

  return (
    <ProjectTreeTable
      scope={scope}
      sliceId={''}
      // pagination
      fetchMoreOnBottomReached={fetchNextPage}
      pt={{
        columns: {
          hidden: hiddenColumns,
          readonly: readOnly,
        },
      }}
    />
  )
}

export default ListItemsTable
