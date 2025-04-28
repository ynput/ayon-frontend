import { useListItemsDataContext } from '@pages/ProjectListsPage/context/ListItemsDataContext'
import { FC } from 'react'

interface ListItemsTableProps {}

const ListItemsTable: FC<ListItemsTableProps> = ({}) => {
  const { listItemsData } = useListItemsDataContext()

  return (
    <div>
      {listItemsData.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  )
}

export default ListItemsTable
