import { useCallback, useMemo } from 'react'
import type { ExpandedState } from '@tanstack/react-table'
import { useGetEntityGroups } from '@shared/hooks'
import type { ProjectTableModulesType } from '@shared/hooks'
import {
  buildQueryFilters,
  checkColumnVisibility,
  useColumnSettingsContext,
  useEntitiesMap,
  useFetchOverviewData,
  useProjectDataContext,
  useQueryFilters,
} from '@shared/containers/ProjectTreeTable'
import type { QueryFilter, TableGroupBy } from '@shared/containers/ProjectTreeTable'
import type { SliceFilter } from '@shared/containers/Slicer'
import { splitClientFiltersByScope, splitFiltersByScope } from '@shared/components'
import { getRequestErrorString } from '@shared/util'
import { useAppDispatch } from '@state/store'
import { useProjectOverviewStats } from './useProjectOverviewStats'

/**
 * What the Overview's task and folder data shows: the Overview page's view and slicer
 * (`ProjectOverviewProvider`), or the props of the addons' EntityTable.
 */
export interface OverviewDataSource {
  // the filter bar's filter (task and folder scopes combined)
  filter: QueryFilter
  // the slicer's filters (empty: none)
  sliceFilters: SliceFilter[]
  // folders selected in the slicer (hierarchy or lists)
  selectedFolders: string[]
  // hierarchy: selected folders are scope roots, only their descendants are rows
  excludeSelectedFolders: boolean
  // the rows narrowed to these tasks (empty: no narrowing)
  taskIds: string[]
  // the rows narrowed to these folders, as an `id in` condition of the folder filter, so the rows
  // and the folder stats narrow together
  folderIds?: string[]
  groupBy: TableGroupBy | undefined
  showHierarchy: boolean
  isFlatFolderView: boolean
  // no folder stats: the rows are given tasks, whose folders the folder stats can't narrow to
  skipFolderStats?: boolean
  // the view settings are still loading
  isLoadingViews: boolean
  // the licence or the selected lists' ids are still resolving: hold the queries
  isLoadingSlice: boolean
}

interface UseOverviewDataParams {
  projectName: string
  source: OverviewDataSource
  modules: ProjectTableModulesType
  expanded: ExpandedState
  setExpanded: (expanded: ExpandedState) => void
  skipLinks: boolean
  // entity ids rendered in the table's viewport (link loading)
  visibleEntityIds?: string[]
}

const EMPTY_FILTER: QueryFilter = { conditions: [] }
const VALID_SCOPES: ('task' | 'folder')[] = ['task', 'folder']
// filter ids without a scope prefix
const FILTER_SCOPES = { taskType: 'task', assignees: 'task', folderType: 'folder' } as const

/** `filter` AND "id is one of `ids`". */
const withIdsCondition = (filter: QueryFilter, ids: string[] | undefined): QueryFilter => {
  if (!ids) return filter
  const idsCondition = { key: 'id', operator: 'in' as const, value: ids }
  if (!filter.conditions?.length) return { operator: 'and', conditions: [idsCondition] }
  return { operator: 'and', conditions: [filter, idsCondition] }
}

/**
 * The Overview's task and folder data for a source: its filters split by scope and combined with
 * the slicer's, the grouping, the summaries row's stats and the rows. Shared by the Overview page
 * and EntityTable, so both request the same.
 */
export const useOverviewData = ({
  projectName,
  source,
  modules,
  expanded,
  setExpanded,
  skipLinks,
  visibleEntityIds,
}: UseOverviewDataParams) => {
  const {
    filter,
    sliceFilters,
    selectedFolders,
    excludeSelectedFolders,
    taskIds,
    folderIds,
    groupBy,
    showHierarchy,
    isFlatFolderView,
    skipFolderStats,
    isLoadingViews,
    isLoadingSlice,
  } = source
  const dispatch = useAppDispatch()
  const { attribFields } = useProjectDataContext()
  const { sorting, defaultColumnVisibility, columnVisibility } = useColumnSettingsContext()

  // comments are the heaviest field to resolve, so only fetch them when the column is shown
  const showComments = useMemo(
    () => checkColumnVisibility(columnVisibility, 'comments', defaultColumnVisibility),
    [columnVisibility, defaultColumnVisibility],
  )

  // GET GROUPING — folderType can only be used with entity type 'folder'
  const { groups: taskGroups, error: groupingError } = useGetEntityGroups({
    groupBy,
    projectName,
    entityType: groupBy?.id === 'folderType' ? 'folder' : 'task',
  })

  // Separate the combined filters into task and folder filters
  const { task: taskFilter = EMPTY_FILTER, folder: folderFilter = EMPTY_FILTER } = useMemo(
    () => splitFiltersByScope(filter, VALID_SCOPES, { fallbackScope: 'task' }, FILTER_SCOPES),
    [filter],
  ) as { task?: QueryFilter; folder?: QueryFilter }

  // Separate slicer filters into different types
  const attribScopeMap = useMemo(
    () =>
      attribFields.reduce<Record<string, string>>((acc, field) => {
        const scope = VALID_SCOPES.find((s) => field.scope?.includes(s))
        if (scope) acc[`attrib.${field.name}`] = scope
        return acc
      }, {}),
    [attribFields],
  )
  const sliceScopeMap = useMemo(
    () => ({
      status: 'task', // status defaults to task for overview
      ...FILTER_SCOPES,
      ...attribScopeMap,
    }),
    [attribScopeMap],
  ) as Record<string, 'task' | 'folder'>

  const { task: slicerTaskFilters, folder: slicerFolderFilters } = useMemo(
    () => splitClientFiltersByScope(sliceFilters, VALID_SCOPES, sliceScopeMap),
    [sliceFilters, sliceScopeMap],
  )

  // folders by id are a folder condition, so the folder search and its stats both narrow to them
  const folderFilterWithIds = useMemo(
    () => withIdsCondition(folderFilter, folderIds),
    [folderFilter, folderIds],
  )

  // Combine slicer filters with task/folder filters
  const combinedTaskFilter = useQueryFilters({
    queryFilters: taskFilter,
    sliceFilters: slicerTaskFilters,
    config: { searchKey: 'name' },
  })
  // folder names stay filter conditions: the folder search of the table (REST folder search) and
  // the task queries (folderFilter) have no folder text search, so a search would be dropped there
  const combinedFolderFilter = useQueryFilters({
    queryFilters: folderFilterWithIds,
    sliceFilters: slicerFolderFilters,
  })
  const taskFilters = useMemo(
    () => ({
      filter: combinedTaskFilter.filter,
      filterString: combinedTaskFilter.filterString,
      search: combinedTaskFilter.search,
    }),
    [combinedTaskFilter],
  )
  const folderFilters = useMemo(
    () => ({
      filter: combinedFolderFilter.filter,
      filterString: combinedFolderFilter.filterString,
      search: combinedFolderFilter.search,
    }),
    [combinedFolderFilter],
  )

  // Slicer value counts: each panel's args exclude its OWN filter (so a selected
  // value keeps its siblings' true counts) but keep every other panel's filter
  // plus the hierarchy/entity-list ids — facet counts that match the filtered
  // table. With nothing selected all panels produce identical args, so their
  // stats queries collapse onto one shared cache entry.
  const getSlicerCountsArgs = useCallback(
    (sliceType: string) => {
      const otherSliceFilters = sliceFilters.filter((f) => f.id !== sliceType)
      const { task: otherTaskFilters, folder: otherFolderFilters } = splitClientFiltersByScope(
        otherSliceFilters,
        VALID_SCOPES,
        sliceScopeMap,
      )
      const countsTaskFilter = buildQueryFilters({
        queryFilters: taskFilter,
        sliceFilters: otherTaskFilters,
        config: { searchKey: 'name' },
      })
      const countsFolderFilter = buildQueryFilters({
        queryFilters: folderFilterWithIds,
        sliceFilters: otherFolderFilters,
      })
      return {
        projectName,
        filter: countsTaskFilter.filterString || undefined,
        folderFilter: countsFolderFilter.filterString || undefined,
        search: countsTaskFilter.search || undefined,
        folderIds: selectedFolders.length ? selectedFolders : undefined,
        taskIds: taskIds.length ? taskIds : undefined,
      }
    },
    [
      sliceFilters,
      sliceScopeMap,
      taskFilter,
      folderFilterWithIds,
      projectName,
      selectedFolders,
      taskIds,
    ],
  )

  const stats = useProjectOverviewStats({
    folderFilter: folderFilters.filterString,
    taskFilter: taskFilters.filterString,
    folderSearch: folderFilters.search,
    taskSearch: taskFilters.search,
    selectedFolders,
    selectedTaskIds: taskIds,
    showHierarchy,
    isFlatFolderView,
    excludeSelectedFolders,
    isLoadingViews,
    skipFolderStats,
  })

  // DATA FETCHING
  const data = useFetchOverviewData({
    projectName,
    selectedFolders,
    // hierarchy ids are scope roots (excluded from rows); list ids are results
    excludeSelectedFolders,
    taskIds,
    taskFilters: taskFilters as any,
    folderFilters: folderFilters as any,
    expanded,
    sorting,
    groupBy,
    taskGroups,
    showHierarchy,
    isFlatFolderView,
    attribFields,
    modules,
    skipLinks,
    showComments,
    isLoadingViews: isLoadingViews || isLoadingSlice,
    onCollapseAll: () => setExpanded({}),
    visibleEntityIds,
    folderStatsArgs: stats.folderStatsArgs,
    taskStatsArgs: stats.taskStatsArgs,
    folderStatsUninitialized: stats.isUninitializedFolderStats,
    taskStatsUninitialized: stats.isUninitializedTaskStats,
    dispatch,
  })

  // combine foldersMap and tasksMap into a single map
  const entitiesMap = useEntitiesMap({ foldersMap: data.foldersMap, tasksMap: data.tasksMap })
  const error =
    getRequestErrorString(groupingError) || getRequestErrorString(data.error) || undefined

  return {
    ...data,
    entitiesMap,
    error,
    taskGroups,
    taskFilters,
    folderFilters,
    getSlicerCountsArgs,
    folderStats: stats.folderStats,
    taskStats: stats.taskStats,
    folderStatsLoading: stats.folderStatsLoading,
    taskStatsLoading: stats.taskStatsLoading,
    folderStatsError: stats.folderStatsError,
    taskStatsError: stats.taskStatsError,
  }
}
