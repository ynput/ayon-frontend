import { useListItemsDataContext } from '@pages/ProjectListsPage/context/ListItemsDataContext'
import { useListsContext } from '@pages/ProjectListsPage/context/ListsContext'
import { EmptyPlaceholder } from '@shared/components'
import { FC } from 'react'

interface ListItemsTableProps {}

const ListItemsTable: FC<ListItemsTableProps> = ({}) => {
  const { rowSelection } = useListsContext()
  const selectedListsIds = Object.entries(rowSelection).filter(([_, isSelected]) => isSelected)
  const isMultipleSelected = selectedListsIds.length > 1
  const { listItemsData, isError } = useListItemsDataContext()

  if (!selectedListsIds.length) return <EmptyPlaceholder message="Start by selecting a list." />

  if (isMultipleSelected)
    return <EmptyPlaceholder message="Please select one list to view its items." />

  if (isError) return <EmptyPlaceholder message="Error loading list items." />

  return (
    <div>
      {listItemsData.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  )
}

export default ListItemsTable
