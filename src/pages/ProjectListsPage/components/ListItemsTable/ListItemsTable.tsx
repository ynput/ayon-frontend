import { useListItemsDataContext } from '@pages/ProjectListsPage/context/ListItemsDataContext'
import { useListsContext } from '@pages/ProjectListsPage/context'
import { getColumnConfigFromType } from '@pages/ProjectListsPage/util'
import ListItemsShortcuts from '@pages/ProjectListsPage/util/ListItemsShortcuts'
import { EmptyPlaceholder } from '@shared/components'
import {
  BuildTreeTableColumnsProps,
  ProjectTreeTable,
  isFilterError,
  getFilterErrorMessage,
  extractQueryErrorMessage,
} from '@shared/containers/ProjectTreeTable'
import { Button } from '@ynput/ayon-react-components'
import { FC, useMemo } from 'react'
import ListsAttributesShortcutButton from '../ListsTableSettings/ListsAttributesShortcutButton'
import { UniqueIdentifier } from '@dnd-kit/core'
import { useProjectContext } from '@shared/context'
import ImportDialogButton from '@containers/ImportDialog/ImportDialogButton'

interface ListItemsTableProps {
  extraColumns: BuildTreeTableColumnsProps['extraColumns']
  isLoading?: boolean
  isReview?: boolean
  dndActiveId?: UniqueIdentifier | null // Added prop
  viewOnly?: boolean
}

const ListItemsTable: FC<ListItemsTableProps> = ({
  extraColumns,
  isLoading,
  isReview,
  dndActiveId, // Destructure new prop
  viewOnly,
}) => {
  const { projectName } = useProjectContext()
  const { selectedLists, selectedList } = useListsContext()
  const {
    isError,
    error,
    fetchNextPage,
    resetFilters,
    listItemsFilters,
    setLinksVisible,
    fieldStats,
    fieldStatsLoading,
    fieldStatsError,
    mainCountLabels,
  } = useListItemsDataContext()
  const scope = `lists-${projectName}`

  const [hiddenColumns, readOnly] = useMemo(
    () => getColumnConfigFromType(selectedList?.entityType),
    [selectedList],
  )

  if (!selectedList)
    return (
      <EmptyPlaceholder message="Start by selecting or importing a list.">
        <ImportDialogButton importContext="entity_list_item" projectName={projectName} />
      </EmptyPlaceholder>
    )

  if (selectedLists.length > 1)
    return <EmptyPlaceholder message="Please select one list to view its items." />

  if (isError) {
    if (isFilterError(error, { filter: listItemsFilters })) {
      return (
        <EmptyPlaceholder message={getFilterErrorMessage('List items')} icon="filter_alt_off">
          <Button label="Reset filters" icon="replay" onClick={resetFilters} />
        </EmptyPlaceholder>
      )
    }
    const errorMessage = extractQueryErrorMessage(error) || 'Error loading list items.'
    return (
      <EmptyPlaceholder error={errorMessage} ynputError={false}>
        <Button label="Reset" icon="replay" onClick={resetFilters} />
      </EmptyPlaceholder>
    )
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <ProjectTreeTable
        scope={scope}
        sliceId={''}
        // pagination
        onScrollBottom={fetchNextPage}
        readOnly={readOnly}
        excludedColumns={hiddenColumns}
        extraColumns={extraColumns}
        isLoading={isLoading}
        sortableRows={!viewOnly}
        enableSorting={!isReview}
        dndActiveId={dndActiveId} // Pass prop
        onColumnVisibleChangeSubscribed={['link_*']}
        onColumnVisibleChange={(changes) => {
          if (Object.values(changes).some((v) => v)) {
            // If any link_ column is visible, we set linksVisible to true
            setLinksVisible(true)
          } else {
            setLinksVisible(false)
          }
        }}
        // hidden while the backend doesn't support list item stats yet —
        // renders automatically once the query stops erroring
        showColumnSummaries={!fieldStatsError}
        fieldStats={fieldStats}
        fieldStatsLoading={fieldStatsLoading}
        mainCountLabels={mainCountLabels}
      />
      <ListItemsShortcuts />
      <ListsAttributesShortcutButton />
    </div>
  )
}

export default ListItemsTable
