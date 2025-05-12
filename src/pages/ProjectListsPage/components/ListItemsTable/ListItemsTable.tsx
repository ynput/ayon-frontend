import { useListItemsDataContext } from '@pages/ProjectListsPage/context/ListItemsDataContext'
import { useListsContext } from '@pages/ProjectListsPage/context/ListsContext'
import { getColumnConfigFromType } from '@pages/ProjectListsPage/util'
import ListItemsShortcuts from '@pages/ProjectListsPage/util/ListItemsShortcuts'
import { EmptyPlaceholder } from '@shared/components'
import { BuildTreeTableColumnsProps, ProjectTreeTable } from '@shared/containers/ProjectTreeTable'
import { FC } from 'react'

interface ListItemsTableProps {
  extraColumns: BuildTreeTableColumnsProps['extraColumns']
}

const ListItemsTable: FC<ListItemsTableProps> = ({ extraColumns }) => {
  const { rowSelection, selectedList } = useListsContext()
  const selectedListsIds = Object.entries(rowSelection).filter(([_, isSelected]) => isSelected)
  const isMultipleSelected = selectedListsIds.length > 1
  const { isError, projectName, fetchNextPage } = useListItemsDataContext()
  const scope = `lists-${projectName}`

  const [hiddenColumns, readOnly] = getColumnConfigFromType(selectedList?.entityType)

  if (!selectedListsIds.length) return <EmptyPlaceholder message="Start by selecting a list." />

  if (isMultipleSelected)
    return <EmptyPlaceholder message="Please select one list to view its items." />

  if (isError) return <EmptyPlaceholder error={'Error loading list items.'} />

  return (
    <>
      <ProjectTreeTable
        scope={scope}
        sliceId={''}
        // pagination
        fetchMoreOnBottomReached={fetchNextPage}
        pt={{
          columns: {
            excluded: hiddenColumns,
            readonly: readOnly,
            extraColumns: extraColumns,
          },
        }}
      />
      <ListItemsShortcuts />
    </>
  )
}

export default ListItemsTable
