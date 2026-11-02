// EntityTable for tasks and folders: the Overview's flat task list and its flat folder view
// ("Group by: Folder"), fed by the Overview's data hook (useOverviewData) like
// ProjectOverviewProvider, with the rows from the addon's filter and ids instead of the page's
// view and slicer.
import { useCallback, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import type { ExpandedState } from '@tanstack/react-table'
import type { EntityTableProps } from '@ynput/ayon-addon'
import {
  CellEditingProvider,
  ColumnDndProvider,
  ColumnSettingsProvider,
  ProjectTableProvider,
  ProjectTableQueriesProvider,
  ProjectTreeTable,
  SelectedRowsProvider,
  SelectionCellsProvider,
  useColumnSettingsContext,
  useExpandedState,
  useGroupCounts,
  useProjectDataContext,
  useScopedAttributeFields,
} from '@shared/containers/ProjectTreeTable'
import type { QueryFilter } from '@shared/containers/ProjectTreeTable'
import { mergeFieldStats, totalRowsFromStats } from '@shared/api'
import type { FieldStats } from '@shared/api'
import { useGroupByRemoteModules } from '@shared/hooks'
import { usePowerpack, useSubtasksModulesContext } from '@shared/context'
import { useAppDispatch, useAppSelector } from '@state/store'
import { DEFAULT_COLUMNS_FOLDER, DEFAULT_COLUMNS_TASK } from '@pages/ProjectsPage/constants'
import {
  useOverviewData,
  type OverviewDataSource,
} from '@pages/ProjectOverviewPage/hooks/useOverviewData'
import useTableQueriesHelper from '@pages/ProjectOverviewPage/hooks/useTableQueriesHelper'
import useTableOpenViewer from '@pages/ProjectOverviewPage/hooks/useTableOpenViewer'
import {
  NO_CONTEXT_MENU_ITEMS,
  READ_ONLY_MENU_ITEMS,
  noUpdate,
  readOnlyColumns,
  useEntityTableColumns,
} from './entityTableHelpers'
import * as Styled from './EntityTable.styled'

// the Overview's defaults (ProjectOverviewDataProvider)
const DEFAULT_COLUMN_VISIBILITY = {
  ...DEFAULT_COLUMNS_TASK,
  ...DEFAULT_COLUMNS_FOLDER,
  entityType: true,
}
const SCOPES = { task: ['task'], folder: ['folder', 'task'] }
const EMPTY_FILTER: QueryFilter = { conditions: [] }
const NO_SLICE_FILTERS: OverviewDataSource['sliceFilters'] = []
const NO_IDS: string[] = []
const noop = () => {}

type OverviewEntityTableProps = Omit<EntityTableProps, 'entityType'> & {
  entityType: 'task' | 'folder'
}

export const OverviewEntityTable = ({
  columns,
  onColumnsChange,
  ...props
}: OverviewEntityTableProps) => {
  // flat folder view isn't grouped, and the task list of given ids can't be (the grouped task
  // queries take filters, not ids)
  const groupByDisabled = props.entityType === 'folder' || !!props.ids
  const { config, onChange } = useEntityTableColumns(columns, onColumnsChange, groupByDisabled)

  return (
    <ColumnSettingsProvider
      config={config}
      onChange={onChange}
      defaultColumnVisibility={DEFAULT_COLUMN_VISIBILITY}
    >
      <ColumnDndProvider>
        <OverviewEntityTableData {...props} groupByDisabled={groupByDisabled} />
      </ColumnDndProvider>
    </ColumnSettingsProvider>
  )
}

type DataProps = Omit<OverviewEntityTableProps, 'columns' | 'onColumnsChange'> & {
  groupByDisabled: boolean
}

const OverviewEntityTableData = ({
  projectName,
  entityType,
  filter,
  ids,
  excludedColumns,
  className,
  groupByDisabled,
}: DataProps) => {
  const dispatch = useAppDispatch()
  const { attribFields, users, isInitialized, isLoading: isLoadingData } = useProjectDataContext()
  const { groupBy: columnsGroupBy } = useColumnSettingsContext()
  const modules = useGroupByRemoteModules()
  const isFolders = entityType === 'folder'

  const scopedAttribFields = useScopedAttributeFields({
    attribFields,
    allowedScopes: SCOPES[entityType],
  })

  const [expanded, setExpanded] = useState<ExpandedState>({})
  const { updateExpanded, toggleExpanded } = useExpandedState({ expanded, setExpanded })

  // group by: the column settings' (the folder view and given task ids have none)
  const groupBy = useMemo(
    () =>
      !groupByDisabled && columnsGroupBy && columnsGroupBy.id !== 'folder'
        ? columnsGroupBy
        : undefined,
    [groupByDisabled, columnsGroupBy],
  )
  // the addon's rows as the Overview data's input: its filter and ids instead of the page's view
  // and slicer
  const source = useMemo<OverviewDataSource>(
    () => ({
      filter: (filter ?? EMPTY_FILTER) as QueryFilter,
      sliceFilters: NO_SLICE_FILTERS,
      selectedFolders: NO_IDS,
      excludeSelectedFolders: true,
      taskIds: (!isFolders && ids) || NO_IDS,
      folderIds: isFolders ? ids : undefined,
      groupBy,
      showHierarchy: false,
      isFlatFolderView: isFolders,
      // the task list counts its tasks, the folder view its folders and their tasks
      skipFolderStats: !isFolders,
      isLoadingViews: false,
      isLoadingSlice: false,
    }),
    [filter, isFolders, ids, groupBy],
  )

  const overview = useOverviewData({
    projectName,
    source,
    modules,
    expanded,
    setExpanded,
    // no link columns (includeLinks below)
    skipLinks: true,
  })
  const { isLoadingAll, fetchNextPage, taskFilters, folderFilters } = overview

  const { counts: groupCounts, complete: groupCountsComplete } = useGroupCounts({
    entity: 'task',
    groupBy,
    args: {
      projectName,
      filter: taskFilters.filterString || undefined,
      folderFilter: folderFilters.filterString || undefined,
      search: taskFilters.search || undefined,
    },
  })

  const { getFoldersTasks } = useTableQueriesHelper({ projectName })
  const powerpack = usePowerpack()
  const { SubtasksManager } = useSubtasksModulesContext()
  const viewerOpen = useAppSelector((state) => state.viewer.isOpen)
  const handleOpenPlayer = useTableOpenViewer({ projectName })

  const { folderStats, taskStats } = overview
  const fieldStats = useMemo(() => {
    const mainCount: FieldStats = {
      columnName: 'name',
      primaryCount: folderStats ? totalRowsFromStats(folderStats) : undefined,
      secondaryCount: taskStats ? totalRowsFromStats(taskStats) : undefined,
    }
    return mergeFieldStats([...(taskStats ?? []), mainCount])
  }, [folderStats, taskStats])

  const readOnly = useMemo(() => readOnlyColumns(attribFields), [attribFields])
  const handleScrollBottom = useCallback(() => {
    if (isLoadingAll) return
    fetchNextPage()
  }, [isLoadingAll, fetchNextPage])

  return (
    <ProjectTableQueriesProvider updateEntities={noUpdate} getFoldersTasks={getFoldersTasks}>
      <ProjectTableProvider
        isInitialized={isInitialized}
        isLoading={overview.isLoadingAll || isLoadingData}
        isLoadingMore={overview.isLoadingMore}
        loadingTasks={overview.loadingTasks}
        error={overview.error}
        softError={overview.softError}
        softErrorAction={overview.softErrorAction}
        users={users}
        attribFields={scopedAttribFields}
        scopes={SCOPES[entityType]}
        tasksMap={overview.tasksMap}
        foldersMap={overview.foldersMap}
        entitiesMap={overview.entitiesMap}
        tasksByFolderMap={overview.tasksByFolderMap}
        fetchNextPage={fetchNextPage}
        onSyncData={overview.onSyncData}
        loadingLinksEntityIds={overview.loadingLinksEntityIds}
        groups={isFolders ? [] : overview.taskGroups}
        groupCounts={groupCounts}
        groupCountsComplete={groupCountsComplete}
        groupByConfig={{ entityType: 'task' }}
        groupByDisabled={groupByDisabled}
        // the table's filter type (operations) differs only in name from the query's
        queryFilters={taskFilters as any}
        showHierarchy={false}
        updateShowHierarchy={noop}
        isFlatFolderView={isFolders}
        expanded={expanded}
        toggleExpanded={toggleExpanded}
        updateExpanded={updateExpanded}
        setExpanded={setExpanded}
        contextMenuItems={NO_CONTEXT_MENU_ITEMS}
        powerpack={powerpack}
        modules={modules}
        playerOpen={viewerOpen}
        onOpenPlayer={handleOpenPlayer}
        SubtasksManager={SubtasksManager}
        useParams={useParams}
        useNavigate={useNavigate}
        useLocation={useLocation}
        useSearchParams={useSearchParams}
        dispatch={dispatch}
      >
        <SelectionCellsProvider>
          <SelectedRowsProvider>
            <CellEditingProvider>
              <Styled.TableWrapper className={className}>
                <ProjectTreeTable
                  scope={`entity-table-${entityType}-${projectName}`}
                  sliceId=""
                  readOnly={readOnly}
                  excludedColumns={excludedColumns}
                  includeLinks={false}
                  onScrollBottom={handleScrollBottom}
                  onScrollBottomGroupBy={fetchNextPage}
                  // folder rows come all at once (flat folder view): sorted in the client
                  clientSorting={isFolders}
                  contextMenuItems={READ_ONLY_MENU_ITEMS}
                  showColumnSummaries
                  fieldStats={fieldStats}
                  groupFieldStats={folderStats}
                  fieldStatsLoading={overview.folderStatsLoading || overview.taskStatsLoading}
                  fieldStatsError={overview.folderStatsError || overview.taskStatsError}
                  mainBreakdownFields={{ primary: 'folderType', secondary: 'taskType' }}
                />
              </Styled.TableWrapper>
            </CellEditingProvider>
          </SelectedRowsProvider>
        </SelectionCellsProvider>
      </ProjectTableProvider>
    </ProjectTableQueriesProvider>
  )
}
