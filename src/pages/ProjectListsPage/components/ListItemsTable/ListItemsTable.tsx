import { useListItemsDataContext } from '@pages/ProjectListsPage/context/ListItemsDataContext'
import { useListsContext } from '@pages/ProjectListsPage/context'
import { getColumnConfigFromType } from '@pages/ProjectListsPage/util'
import ListItemsShortcuts from '@pages/ProjectListsPage/util/ListItemsShortcuts'
import { EmptyPlaceholder } from '@shared/components'
import {
  BuildTreeTableColumnsProps,
  ProjectTreeTable,
  useColumnSettingsContext,
  useProjectTableContext,
} from '@shared/containers/ProjectTreeTable'
import { useViewsContext } from '@shared/containers'
import { Button } from '@ynput/ayon-react-components'
import { FC, useMemo } from 'react'
import ListsAttributesShortcutButton from '../ListsTableSettings/ListsAttributesShortcutButton'
import { UniqueIdentifier } from '@dnd-kit/core'
import { useProjectContext, usePowerpack } from '@shared/context'
import ImportDialogButton from '@containers/ImportDialog/ImportDialogButton'
import {
  buildMetricTargets,
  mergeFieldStats,
  totalRowsFromStats,
  toListItemsStatsTargets,
  useGetListItemsColumnStatsQuery,
} from '@shared/api'
import type { FieldStats, StatsEntity } from '@shared/api'

const STATS_ENTITIES: Record<string, StatsEntity> = {
  folder: 'folder',
  task: 'task',
  product: 'product',
  version: 'version',
}

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
    setLinksVisible,
    selectedListId,
    listItemsFilters,
  } = useListItemsDataContext()
  const scope = `lists-${projectName}`

  const [hiddenColumns, readOnly] = useMemo(
    () => getColumnConfigFromType(selectedList?.entityType),
    [selectedList],
  )

  // column summaries footer (powerpack) — stats query is a no-op until the
  // backend supports calculateSpecificStatistics on entity list items
  const { attribFields } = useProjectTableContext()
  const { columnVisibility } = useColumnSettingsContext()
  const { isLoadingViews } = useViewsContext()
  const { powerLicense } = usePowerpack()

  const statsEntity = selectedList?.entityType
    ? STATS_ENTITIES[selectedList.entityType]
    : undefined

  const statsTargets = useMemo(
    () =>
      statsEntity
        ? toListItemsStatsTargets(
            buildMetricTargets({ entity: statsEntity, attribs: attribFields, columnVisibility }),
          )
        : [],
    [statsEntity, attribFields, columnVisibility],
  )

  const statsFilter = listItemsFilters?.conditions?.length
    ? JSON.stringify(listItemsFilters)
    : undefined

  const {
    data: itemStats,
    isFetching: itemStatsLoading,
    isError: itemStatsError,
  } = useGetListItemsColumnStatsQuery(
    {
      projectName,
      listId: selectedListId || '',
      filter: statsFilter,
      targets: statsTargets,
    },
    { skip: !projectName || !selectedListId || !statsEntity || isLoadingViews || !powerLicense },
  )

  const fieldStats = useMemo(() => {
    const items = itemStats ?? []
    const mainCount: FieldStats = {
      columnName: 'name',
      primaryCount: itemStats ? totalRowsFromStats(items) : undefined,
    }
    return mergeFieldStats([...items, mainCount])
  }, [itemStats])

  const mainCountLabels = useMemo(
    () => ({ primary: statsEntity ? `${statsEntity}s` : 'items' }),
    [statsEntity],
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
    const errorMessage =
      error instanceof Error
        ? error.message
        : (error as any)?.message ?? 'Error loading list items.'
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
        showColumnSummaries={!itemStatsError}
        fieldStats={fieldStats}
        fieldStatsLoading={itemStatsLoading}
        mainCountLabels={mainCountLabels}
      />
      <ListItemsShortcuts />
      <ListsAttributesShortcutButton />
    </div>
  )
}

export default ListItemsTable
