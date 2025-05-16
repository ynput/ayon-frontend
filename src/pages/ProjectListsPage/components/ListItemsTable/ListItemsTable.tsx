import { useListItemsDataContext } from '@pages/ProjectListsPage/context/ListItemsDataContext'
import { useListsContext } from '@pages/ProjectListsPage/context/ListsContext'
import { getColumnConfigFromType } from '@pages/ProjectListsPage/util'
import ListItemsShortcuts from '@pages/ProjectListsPage/util/ListItemsShortcuts'
import { EmptyPlaceholder } from '@shared/components'
import { BuildTreeTableColumnsProps, ProjectTreeTable } from '@shared/containers/ProjectTreeTable'
import { Button } from '@ynput/ayon-react-components'
import { FC, useMemo } from 'react'
import ListsAttributesShortcutButton from '../ListsTableSettings/ListsAttributesShortcutButton'

interface ListItemsTableProps {
  extraColumns: BuildTreeTableColumnsProps['extraColumns']
  isLoading?: boolean
}

const ListItemsTable: FC<ListItemsTableProps> = ({ extraColumns, isLoading }) => {
  const { selectedLists, selectedList } = useListsContext()
  const { isError, projectName, fetchNextPage, resetFilters } = useListItemsDataContext()
  const scope = `lists-${projectName}`

  const [hiddenColumns, readOnly] = useMemo(
    () => getColumnConfigFromType(selectedList?.entityType),
    [selectedList],
  )

  if (!selectedList) return <EmptyPlaceholder message="Start by selecting a list." />

  if (selectedLists.length > 1)
    return <EmptyPlaceholder message="Please select one list to view its items." />

  if (isError)
    return (
      <EmptyPlaceholder error={'Error loading list items.'}>
        <Button label="Reset" icon="replay" onClick={resetFilters} />
      </EmptyPlaceholder>
    )

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <ProjectTreeTable
        scope={scope}
        sliceId={''}
        // pagination
        fetchMoreOnBottomReached={fetchNextPage}
        readOnly={readOnly}
        excludedColumns={hiddenColumns}
        extraColumns={extraColumns}
        isLoading={isLoading}
      />
      <ListItemsShortcuts />
      <ListsAttributesShortcutButton />
    </div>
  )
}

export default ListItemsTable
