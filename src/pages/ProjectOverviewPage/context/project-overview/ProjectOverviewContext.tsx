// React imports
import { useCallback, useMemo, useState } from 'react'

// Third-party libraries
import { ExpandedState } from '@tanstack/react-table'
import { OverviewSettings } from '@shared/api'

// Shared components and hooks
import { useSessionStorage } from '@shared/hooks'

// Shared ProjectTreeTable
import {
  useProjectDataContext,
  useQueryFilters,
  useSelectedFolders,
  scopeIdsToFolders,
  useScopedAttributeFields,
  useExpandedState,
  createLocalStorageKey,
  ProjectOverviewProviderProps,
  useColumnSettingsContext,
  checkColumnVisibility,
} from '@shared/containers/ProjectTreeTable'
import type { ContextMenuItemConstructors } from '@shared/containers/ProjectTreeTable'

// Views hooks
import { useOverviewViewSettings, useViewsContext, useViewUpdateHelper } from '@shared/containers'

// Local context and hooks
import { useSelectedEntityIds, useSlicerPanelSelections } from '@shared/containers/Slicer'
import { useOverviewData, type OverviewDataSource } from '../../hooks/useOverviewData'
import { useProjectContext, useProjectFoldersContext } from '@shared/context'
import { ProjectOverviewContext } from './ProjectOverviewContextInstance'
import useOverviewContextMenu from '../../hooks/useOverviewContextMenu'
import type { MultiEntityMoveData, OpenMoveDialog } from '@shared/containers/MoveEntityDialog'

export const ProjectOverviewProvider = ({ children, modules }: ProjectOverviewProviderProps) => {
  // Get project data from the new context
  const { projectName, ...projectInfo } = useProjectContext()
  const { attribFields, users, isInitialized, isLoading: isLoadingData } = useProjectDataContext()

  const { getChildFolderIds } = useProjectFoldersContext()

  const { groupBy: panelGroupBy, defaultColumnVisibility } = useColumnSettingsContext()

  const { sliceSelections, sliceFilters, isLicensePending } = useSlicerPanelSelections(attribFields)

  // filter out attribFields by scope
  const scopedAttribFields = useScopedAttributeFields({
    attribFields,
    allowedScopes: ['task', 'folder'],
  })

  const page = 'overview'

  const [expanded, setExpanded] = useSessionStorage<ExpandedState>(
    createLocalStorageKey(page, 'expanded', projectName),
    {},
  )

  const { updateExpanded, toggleExpanded, expandedIds } = useExpandedState({
    expanded,
    setExpanded,
  })

  const [movingEntities, setMovingEntities] = useState<MultiEntityMoveData | null>(null)
  const openMoveDialog = useCallback<OpenMoveDialog>((data) => {
    setMovingEntities('entities' in data ? data : { entities: [data] })
  }, [])
  const closeMoveDialog = useCallback(() => {
    setMovingEntities(null)
  }, [])
  const contextMenuItems: ContextMenuItemConstructors = useOverviewContextMenu({
    openMoveDialog,
  })

  // view context and update helper
  const { viewSettings, isLoadingViews } = useViewsContext()
  const { updateViewSettings } = useViewUpdateHelper()

  // View mode derived purely from server viewSettings — no localStorage, no sync effect.
  // undefined = view settings not loaded yet (dropdown stays empty)
  // null = hierarchy, 'none' = flat list, other string = groupBy field id ('folderType', 'status', 'folder', ...)
  const overviewShowHierarchy = (viewSettings as OverviewSettings | undefined)?.showHierarchy
  const overviewGroupBy = (viewSettings as OverviewSettings | undefined)?.groupBy
  const viewGroupBy = useMemo<string | null | undefined>(() => {
    // Before first load, do not assume any grouping — the dropdown must stay
    // empty so the user doesn't see a "Hierarchy" flicker while the saved
    // view is still being fetched.
    if (isLoadingViews || !viewSettings) return undefined
    const showHierarchy = overviewShowHierarchy ?? true
    if (showHierarchy) return null
    if (overviewGroupBy) return overviewGroupBy
    return 'none'
  }, [isLoadingViews, viewSettings, overviewShowHierarchy, overviewGroupBy])

  // Derive desc directly from panel groupBy (single source of truth — no separate state)
  const viewGroupByDesc = panelGroupBy?.desc ?? false

  const {
    onUpdateHierarchy: _updateShowHierarchy,
    onUpdateGroupBy: _updateGroupByAtomic,
    filters: queryFilters,
    onUpdateFilters: setQueryFilters,
    columns,
  } = useOverviewViewSettings({ viewSettings, updateViewSettings })

  const [linksVisible, setLinksVisible] = useState(false)

  // entity ids currently rendered in the table's viewport, reported by ProjectTreeTable
  const [visibleEntityIds, setVisibleEntityIds] = useState<string[]>([])

  const hasLinkColumn = useMemo(
    () => checkColumnVisibility(columns.columnVisibility, 'link_', defaultColumnVisibility),
    [columns, defaultColumnVisibility],
  )

  const skipLinks = !hasLinkColumn || !linksVisible

  // Derive effective showHierarchy from viewGroupBy.
  // null = explicit hierarchy, undefined = not loaded yet — both default to
  // hierarchy-style fetching to avoid firing a flat-list query against an
  // empty config during the initial load window.
  const showHierarchy = viewGroupBy === null || viewGroupBy === undefined

  // Flat folder view: shows all folders flat, each expandable to reveal tasks
  const isFlatFolderView = viewGroupBy === 'folder'

  // User action handler — writes to server via ONE atomic PATCH. Previously split
  // into `_updateShowHierarchy` + `updateGroupBy`, which fired two requests that
  // both captured the same pre-update viewSettings snapshot; the second silently
  // reverted the first's showHierarchy change (race).
  const updateViewGroupBy = useCallback(
    (newViewGroupBy: string | null, desc?: boolean) => {
      if (newViewGroupBy === null) {
        _updateGroupByAtomic(undefined, true, undefined)
      } else if (newViewGroupBy === 'none') {
        _updateGroupByAtomic(undefined, false, undefined)
      } else {
        // 'folder' persists as groupBy sentinel so reload distinguishes it
        // from 'none'. ProjectTableProvider skips grouping when isFlatFolderView.
        _updateGroupByAtomic(newViewGroupBy, false, desc ?? viewGroupByDesc)
      }
    },
    [_updateGroupByAtomic, viewGroupByDesc],
  )

  const updateShowHierarchy = useCallback(
    (newShowHierarchy: boolean) => {
      _updateShowHierarchy(newShowHierarchy)
    },
    [_updateShowHierarchy],
  )

  // Build the effective groupBy for data fetching from the view dropdown
  // This is independent from the Customize panel's groupBy
  // For flat folder view, we don't need a groupBy — it uses hierarchy-style task fetching
  const viewGroupByObj = useMemo(
    () =>
      viewGroupBy && viewGroupBy !== 'none' && !isFlatFolderView
        ? { id: viewGroupBy, desc: viewGroupByDesc }
        : undefined,
    [viewGroupBy, isFlatFolderView, viewGroupByDesc],
  )

  // Use the shared hook to handle filter logic (for backward compatibility)
  const queryFiltersResult = useQueryFilters({
    queryFilters,
    sliceFilters,
    config: { searchKey: 'name' },
  })

  // Resolve entity list selections to IDs
  const {
    entityIds,
    rawEntityIds,
    parentMaps,
    isLoading: isResolvingListIds,
  } = useSelectedEntityIds({
    slices: sliceSelections,
    projectName,
  })

  const { selectedFolders, folderScope, listPanelSelected } = useSelectedFolders({
    slices: sliceSelections,
    entityListFolderIds: entityIds.folderIds,
    getChildFolderIds,
  })

  // list tasks narrowed to the hierarchy panel's subtree
  const selectedTaskIds = useMemo(
    () => scopeIdsToFolders(rawEntityIds.taskIds, parentMaps.taskFolderIds, folderScope),
    [rawEntityIds.taskIds, parentMaps, folderScope],
  )

  // the page's input to the overview data: its view and its slicer (EntityTable builds the same
  // input from its props)
  const source = useMemo<OverviewDataSource>(
    () => ({
      filter: queryFilters,
      sliceFilters,
      selectedFolders,
      // hierarchy ids are scope roots (excluded from rows); list ids are results
      excludeSelectedFolders: !listPanelSelected,
      taskIds: selectedTaskIds,
      groupBy: viewGroupByObj,
      showHierarchy,
      isFlatFolderView,
      isLoadingViews,
      isLoadingSlice: isLicensePending || isResolvingListIds,
    }),
    [
      queryFilters,
      sliceFilters,
      selectedFolders,
      listPanelSelected,
      selectedTaskIds,
      viewGroupByObj,
      showHierarchy,
      isFlatFolderView,
      isLoadingViews,
      isLicensePending,
      isResolvingListIds,
    ],
  )

  const {
    foldersMap,
    tasksMap,
    entitiesMap,
    tasksByFolderMap,
    fetchNextPage,
    onSyncData,
    isLoadingAll,
    isLoadingMore,
    loadingTasks,
    loadingLinksEntityIds,
    error,
    softError,
    softErrorAction,
    taskGroups,
    taskFilters,
    folderFilters,
    getSlicerCountsArgs,
    folderStats,
    taskStats,
    folderStatsLoading,
    taskStatsLoading,
    folderStatsError,
    taskStatsError,
  } = useOverviewData({
    projectName,
    source,
    modules,
    expanded,
    setExpanded,
    skipLinks,
    visibleEntityIds,
  })

  return (
    <ProjectOverviewContext.Provider
      value={{
        isInitialized: isInitialized,
        isLoading: isLoadingAll || isLoadingData,
        isLoadingMore,
        loadingTasks,
        error,
        softError, // shows a warning banner but doesn't block the table from rendering
        softErrorAction,
        // @ts-expect-error: projectInfo is typed as ProjectInfo | undefined, but the context expects ProjectInfo. This is safe because we check isInitialized above.
        projectInfo,
        attribFields: scopedAttribFields,
        users,
        projectName,
        tasksMap,
        foldersMap,
        entitiesMap,
        tasksByFolderMap,
        fetchNextPage,
        onSyncData,
        folderStats,
        taskStats,
        folderStatsLoading,
        taskStatsLoading,
        folderStatsError,
        taskStatsError,
        taskGroups,
        // Separate task and folder filters
        taskFilters,
        folderFilters,
        getSlicerCountsArgs,
        selectedFolders,
        selectedTaskIds,
        // Backward compatibility for ProjectTableProvider (uses taskFilters)
        queryFilters: taskFilters,
        setQueryFilters,
        // Additional filter contexts for dual filtering system
        combinedFilters: queryFiltersResult.combinedFilters,
        displayFilters: queryFiltersResult.displayFilters,
        // hierarchy
        showHierarchy,
        updateShowHierarchy,
        // view mode grouping (top-level dropdown)
        viewGroupBy,
        viewGroupByDesc,
        updateViewGroupBy,
        // flat folder view
        isFlatFolderView,
        // expanded state
        expanded,
        expandedIds,
        toggleExpanded,
        updateExpanded,
        setExpanded,
        setLinksVisible,
        loadingLinksEntityIds,
        visibleEntityIds,
        setVisibleEntityIds,
        contextMenuItems,
        movingEntities,
        closeMoveDialog,
      }}
    >
      {children}
    </ProjectOverviewContext.Provider>
  )
}
