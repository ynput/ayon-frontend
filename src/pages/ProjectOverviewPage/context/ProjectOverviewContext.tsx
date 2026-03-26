// React imports
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react'

// Third-party libraries
import { ExpandedState } from '@tanstack/react-table'

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
import { useSlicerContext } from '@shared/containers/Slicer'
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

  const { sorting, groupBy: panelGroupBy, updateGroupBy } = useColumnSettingsContext()

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

  // View mode: null = hierarchy, string = groupBy field id (e.g. 'folderType', 'status')
  // Default is derived from server settings: if server has a groupBy, use it;
  // if server has showHierarchy: true (or default), use null (hierarchy mode);
  // otherwise fall back to 'folderType'
  const serverGroupByDefault = panelGroupBy?.id ?? null
  const [viewGroupBy, setViewGroupBy] = useLocalStorage<string | null>(
    createLocalStorageKey(page, 'viewGroupBy', projectName),
    serverGroupByDefault,
  )
  // Derive desc directly from panel groupBy (single source of truth — no separate state)
  const viewGroupByDesc = panelGroupBy?.desc ?? false

  const { updateExpanded, toggleExpanded, expandedIds } = useExpandedState({
    expanded,
    setExpanded,
  })

  // view context and update helper
  const { viewSettings } = useViewsContext()
  const { updateViewSettings } = useViewUpdateHelper()

  const {
    onUpdateHierarchy: _updateShowHierarchy,
    filters: queryFilters,
    onUpdateFilters: setQueryFilters,
  } = useOverviewViewSettings({ viewSettings, updateViewSettings })

  // Derive effective showHierarchy from viewGroupBy
  // viewGroupBy === null means hierarchy mode, otherwise it's a groupBy field
  const showHierarchy = viewGroupBy === null

  // Flat folder view: shows all folders flat, each expandable to reveal tasks
  const isFlatFolderView = viewGroupBy === 'folder'

  // When user changes viewGroupBy, sync to Customize panel's groupBy
  // onUpdateColumns (called by updateGroupBy) already handles showHierarchy on the server
  const updateViewGroupBy = useCallback(
    (newViewGroupBy: string | null, desc?: boolean) => {
      setViewGroupBy(newViewGroupBy)
      if (newViewGroupBy === null) {
        // Enter hierarchy mode: clear groupBy and persist showHierarchy on server
        _updateShowHierarchy(true)
        updateGroupBy(undefined)
      } else if (newViewGroupBy === 'folder') {
        // Flat folder view: no hierarchy, no groupBy (uses hierarchy-style task fetching)
        // Don't call updateGroupBy — avoids triggering the panel sync effect
        // which would override viewGroupBy back to null
        _updateShowHierarchy(false)
      } else {
        // onUpdateColumns (called by updateGroupBy) sets showHierarchy: false on the server
        updateGroupBy({ id: newViewGroupBy, desc: desc ?? viewGroupByDesc })
      }
    },
    [setViewGroupBy, updateGroupBy, _updateShowHierarchy, viewGroupByDesc],
  )

  // Sync FROM Customize panel TO dropdown when panel's groupBy id changes
  const panelGroupById = panelGroupBy?.id
  const prevPanelGroupByIdRef = useRef(panelGroupById)
  useEffect(() => {
    if (panelGroupById !== prevPanelGroupByIdRef.current) {
      prevPanelGroupByIdRef.current = panelGroupById
      setViewGroupBy(panelGroupById ?? null)
    }
  }, [panelGroupById, setViewGroupBy])

  // For backward compat: wrap updateShowHierarchy to also update viewGroupBy
  const updateShowHierarchy = useCallback(
    (newShowHierarchy: boolean) => {
      if (newShowHierarchy) {
        setViewGroupBy(null)
      }
      _updateShowHierarchy(newShowHierarchy)
    },
    [setViewGroupBy, _updateShowHierarchy],
  )

  // Build the effective groupBy for data fetching from the view dropdown
  // This is independent from the Customize panel's groupBy
  // For flat folder view, we don't need a groupBy — it uses hierarchy-style task fetching
  const viewGroupByObj = useMemo(
    () => (viewGroupBy && !isFlatFolderView ? { id: viewGroupBy, desc: viewGroupByDesc } : undefined),
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
  const {
    task: [slicerTaskFilter],
    folder: [slicerFolderFilter],
  } = useMemo(() => {
    return splitClientFiltersByScope(sliceFilter ? [sliceFilter] : null, ['task', 'folder'], {
      status: 'task', // status defaults to task for overview
      taskType: 'task',
      assignees: 'task',
      folderType: 'folder',
    })
  }, [sliceFilter])

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

  const selectedFolders = useSelectedFolders({
    rowSelection,
    sliceType,
    persistentRowSelectionData,
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
