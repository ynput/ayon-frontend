import { useListsDataContext } from '@pages/ProjectListsPage/context/ListsDataContext'
import { SearchFilter } from '@ynput/ayon-react-components'
import { FC } from 'react'

interface ListItemsFilterProps {}

const ListItemsFilter: FC<ListItemsFilterProps> = ({}) => {
  const { listsFilters } = useListsDataContext()
  return (
    <SearchFilter
      filters={listsFilters}
      onChange={() => {}}
      options={[]}
      style={{ opacity: 0.7, pointerEvents: 'none' }}
    />
  )
}

export default ListItemsFilter
