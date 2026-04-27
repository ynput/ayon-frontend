// React imports
import { createContext, useCallback, useContext, useMemo } from 'react'

// Third-party libraries
import { ExpandedState } from '@tanstack/react-table'
import { OverviewSettings } from '@shared/api'

// Shared components and hooks
import { useLocalStorage, useGetEntityGroups } from '@shared/hooks'

// Shared ProjectTreeTable
import {
  useProjectDataContext,
  useFetchOverviewData,
  useQueryFilters,
  useEntitiesMap,
  useSelectedFolders,
  useScopedAttributeFields,
  useExpandedState,
  createLocalStorageKey,
  extractErrorMessage,
  ProjectOverviewContextType,
  ProjectOverviewProviderProps,
  useColumnSettingsContext,
} from '@shared/containers/ProjectTreeTable'

// Views hooks
import {
  createFilterFromSlicer,
  useOverviewViewSettings,
  useViewsContext,
  useViewUpdateHelper,
} from '@shared/containers'

// Local context and hooks
import { useSlicerContext, useSelectedEntityIds, useSlicerViewSync } from '@shared/containers/Slicer'
import useOverviewContextMenu from '../hooks/useOverviewContextMenu'
import { useProjectContext } from '@shared/context'
import { splitClientFiltersByScope, splitFiltersByScope } from '@shared/components'

const ProjectOverviewContext = createContext<ProjectOverviewContextType | undefined>(undefined)

export const ProjectOverviewProvider = ({ children, modules }: ProjectOverviewProviderProps) => {
  // Get project data from the new context
  const { projectName, ...projectInfo } = useProjectContext()
  const { attribFields, users, isInitialized, isLoading: isLoadingData } = useProjectDataContext()

  const { rowSelection, rowSelectionData, sliceType, persistentRowSelectionData } =
    useSlicerContext()

  const { sorting, groupBy: panelGroupBy } = useColumnSettingsContext()

  const sliceFilter = createFilterFromSlicer({
    type: sliceType,
    selection: rowSelectionData,
    attribFields: attribFields,
  })

  // filter out attribFields by scope
  const scopedAttribFields = useScopedAttributeFields({
    attribFields,
    allowedScopes: ['task', 'folder'],
  })

  const contextMenuItems = useOverviewContextMenu({})

  const page = 'overview'

  const [expanded, setExpanded] = useLocalStorage<ExpandedState>(
    createLocalStorageKey(page, 'expanded', projectName),
    {},
  )

  const { updateExpanded, toggleExpanded, expandedIds } = useExpandedState({
    expanded,
    setExpanded,
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
    sliceType: viewSliceType,
    onUpdateSliceType,
  } = useOverviewViewSettings({ viewSettings, updateViewSettings })

  // Sync slicer slice type with view settings, selection with localStorage
  useSlicerViewSync(viewSliceType, onUpdateSliceType, isLoadingViews, `slicer-selection-overview-${projectName}`)

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

  // GET GROUPING — use viewGroupBy for the top-level dropdown grouping
  // folderType can only be used with entity type 'folder'
  // viewGroupByObj is already undefined for flat folder view, so no extra guard needed
  const groupingEntityType = viewGroupBy === 'folderType' ? 'folder' : 'task'
  const { groups: taskGroups, error: groupingError } = useGetEntityGroups({
    groupBy: viewGroupByObj,
    projectName,
    entityType: groupingEntityType,
  })

  // Stable default filter to prevent unnecessary re-renders
  const EMPTY_FILTER = useMemo(() => ({ conditions: [] }), [])

  // Separate the combined filters into task and folder filters
  const { task: taskFilter = EMPTY_FILTER, folder: folderFilter = EMPTY_FILTER } = useMemo(() => {
    return splitFiltersByScope(
      queryFilters,
      ['task', 'folder'],
      { fallbackScope: 'task' },
      {
        // Map filter IDs that don't have scope prefix to their scope
        taskType: 'task',
        assignees: 'task',
        folderType: 'folder',
      },
    )
  }, [queryFilters])

  // Separate slicer filters into different types
  const validScopes: ('task' | 'folder')[] = ['task', 'folder']
  const attribScopeMap = useMemo(
    () =>
      attribFields.reduce<Record<string, string>>((acc, field) => {
        const scope = validScopes.find((s) => field.scope?.includes(s))
        if (scope) acc[`attrib.${field.name}`] = scope
        return acc
      }, {}),
    [attribFields],
  )

  const {
    task: [slicerTaskFilter],
    folder: [slicerFolderFilter],
  } = useMemo(() => {
    return splitClientFiltersByScope(sliceFilter ? [sliceFilter] : null, validScopes, {
      status: 'task', // status defaults to task for overview
      taskType: 'task',
      assignees: 'task',
      folderType: 'folder',
      ...attribScopeMap,
    })
  }, [sliceFilter, attribScopeMap])

  // Combine slicer filters with task/folder filters
  const combinedTaskFilter = useQueryFilters({
    queryFilters: taskFilter,
    sliceFilter: slicerTaskFilter,
    config: { searchKey: 'name' },
  })
  const combinedFolderFilter = useQueryFilters({
    queryFilters: folderFilter,
    sliceFilter: slicerFolderFilter,
    config: { searchKey: 'name' },
  })

  // Use the shared hook to handle filter logic (for backward compatibility)
  const queryFiltersResult = useQueryFilters({
    queryFilters,
    sliceFilter,
    config: { searchKey: 'name' },
  })

  // Resolve entity list selections to IDs
  const { entityIds, rawEntityIds } = useSelectedEntityIds()

  const selectedFolders = useSelectedFolders({
    rowSelection,
    sliceType,
    persistentRowSelectionData,
    entityListFolderIds: entityIds.folderIds,
  })

  // DATA FETCHING
  const {
    foldersMap,
    tasksMap,
    tasksByFolderMap,
    fetchNextPage,
    reloadTableData,
    isLoadingAll,
    isLoadingMore,
    loadingTasks,
  } = useFetchOverviewData({
    projectName,
    selectedFolders,
    taskIds: rawEntityIds.taskIds,
    taskFilters: {
      filter: combinedTaskFilter.filter,
      filterString: combinedTaskFilter.filterString,
      search: combinedTaskFilter.search,
    },
    folderFilters: {
      filter: combinedFolderFilter.filter,
      filterString: combinedFolderFilter.filterString,
      search: combinedFolderFilter.search,
    },
    expanded,
    sorting: sorting,
    groupBy: viewGroupByObj,
    taskGroups,
    showHierarchy,
    isFlatFolderView,
    attribFields,
    modules,
  })

  // combine foldersMap and tasksMap into a single map
  const entitiesMap = useEntitiesMap({ foldersMap, tasksMap })

  const error = extractErrorMessage(groupingError)

  return (
    <ProjectOverviewContext.Provider
      value={{
        isInitialized: isInitialized,
        isLoading: isLoadingAll || isLoadingData,
        isLoadingMore,
        loadingTasks,
        error,
        projectInfo,
        attribFields: scopedAttribFields,
        users,
        projectName,
        tasksMap,
        foldersMap,
        entitiesMap,
        tasksByFolderMap,
        fetchNextPage,
        reloadTableData,
        taskGroups,
        // Separate task and folder filters
        taskFilters: {
          filter: combinedTaskFilter.filter,
          filterString: combinedTaskFilter.filterString,
          search: combinedTaskFilter.search,
        },
        folderFilters: {
          filter: combinedFolderFilter.filter,
          filterString: combinedFolderFilter.filterString,
          search: combinedFolderFilter.search,
        },
        // Backward compatibility for ProjectTableProvider (uses taskFilters)
        queryFilters: {
          filter: combinedTaskFilter.filter,
          filterString: combinedTaskFilter.filterString,
          search: combinedTaskFilter.search,
        },
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
        // context menu item
        contextMenuItems,
      }}
    >
      {children}
    </ProjectOverviewContext.Provider>
  )
}

export const useProjectOverviewContext = () => {
  const context = useContext(ProjectOverviewContext)
  if (!context) {
    throw new Error('useProjectOverviewContext must be used within a ProjectOverviewProvider')
  }
  return context
}
