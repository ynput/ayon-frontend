import { useListItemsDataContext } from '@pages/ProjectListsPage/context/ListItemsDataContext'
import { useListsContext } from '@pages/ProjectListsPage/context/ListsContext'
import { getColumnConfigFromType } from '@pages/ProjectListsPage/util'
import ListItemsShortcuts from '@pages/ProjectListsPage/util/ListItemsShortcuts'
import { EmptyPlaceholder } from '@shared/components'
import { BuildTreeTableColumnsProps, ProjectTreeTable } from '@shared/containers/ProjectTreeTable'
import { Button } from '@ynput/ayon-react-components'
import { FC, useMemo } from 'react'

interface ListItemsTableProps {
  extraColumns: BuildTreeTableColumnsProps['extraColumns']
}

const ListItemsTable: FC<ListItemsTableProps> = ({ extraColumns }) => {
  const { rowSelection, selectedList } = useListsContext()
  const selectedListsIds = Object.entries(rowSelection).filter(([_, isSelected]) => isSelected)
  const isMultipleSelected = selectedListsIds.length > 1
  const { isError, projectName, fetchNextPage, resetFilters } = useListItemsDataContext()
  const scope = `lists-${projectName}`

  const [hiddenColumns, readOnly] = useMemo(
    () => getColumnConfigFromType(selectedList?.entityType),
    [selectedList],
  )

  if (!selectedListsIds.length) return <EmptyPlaceholder message="Start by selecting a list." />

  if (isMultipleSelected)
    return <EmptyPlaceholder message="Please select one list to view its items." />

  if (isError)
    return (
      <EmptyPlaceholder error={'Error loading list items.'}>
        <Button label="Reset" icon="replay" onClick={resetFilters} />
      </EmptyPlaceholder>
    )

  return (
    <>
      <ProjectTreeTable
        scope={scope}
        sliceId={''}
        // pagination
        fetchMoreOnBottomReached={fetchNextPage}
        readOnly={readOnly}
        excludedColumns={hiddenColumns}
        extraColumns={extraColumns}
      />
      <ListItemsShortcuts />
    </>
  )
}

export default ListItemsTable
