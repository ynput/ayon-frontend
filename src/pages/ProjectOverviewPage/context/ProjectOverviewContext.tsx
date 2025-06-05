// React imports
import { createContext, useContext } from 'react'

// Third-party libraries
import { ExpandedState, SortingState } from '@tanstack/react-table'
import { isEmpty } from 'lodash'

// Shared components and hooks
import { Filter } from '@ynput/ayon-react-components'
import { useLocalStorage, useUserProjectConfig } from '@shared/hooks'

// Shared ProjectTreeTable
import {
  TableGroupBy,
  useProjectDataContext,
  useFetchOverviewData,
  useQueryFilters,
  useEntitiesMap,
  useSelectedFolders,
  useScopedAttributeFields,
  useExpandedState,
  useColumnSorting,
  createLocalStorageKey,
  extractErrorMessage,
  useGetTaskGroups,
  ProjectOverviewContextType,
  ProjectOverviewProviderProps,
} from '@shared/containers/ProjectTreeTable'

// Local context and hooks
import { useSlicerContext } from '@context/SlicerContext'
import useFilterBySlice from '@containers/TasksProgress/hooks/useFilterBySlice'
import useOverviewContextMenu from '../hooks/useOverviewContextMenu'

const ProjectOverviewContext = createContext<ProjectOverviewContextType | undefined>(undefined)

export const ProjectOverviewProvider = ({ children, modules }: ProjectOverviewProviderProps) => {
  // Get project data from the new context
  const {
    projectName,
    projectInfo,
    attribFields,
    users,
    isInitialized,
    isLoading: isLoadingData,
  } = useProjectDataContext()
  const { filter: sliceFilter } = useFilterBySlice()

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

  // Get column sorting
  const [pageConfig, updatePageConfig, { isSuccess: isConfigReady }] = useUserProjectConfig({
    selectors: ['overview', projectName],
  })

  const [filters, setFilters] = useLocalStorage<Filter[]>(
    createLocalStorageKey(page, 'filters', projectName),
    [],
  )
  const [showHierarchy, updateShowHierarchy] = useLocalStorage<boolean>(
    createLocalStorageKey(page, 'showHierarchy', projectName),
    true,
  )

  let { columnSorting = [], groupBy } = pageConfig as {
    columnSorting: SortingState
    groupBy?: TableGroupBy
  }

  // GET GROUPING
  const { taskGroups, error: groupingError } = useGetTaskGroups({
    groupBy,
    projectName,
  })

  // Use the shared hook to handle filter logic
  const { combinedFilters, ...queryFilters } = useQueryFilters({
    filters,
    sliceFilter,
  })

  const { updateSorting } = useColumnSorting({
    updatePageConfig,
    columnSorting,
  })

  const { rowSelection, sliceType, persistentRowSelectionData } = useSlicerContext()

  // filter out by slice
  const persistedHierarchySelection = isEmpty(persistentRowSelectionData)
    ? null
    : persistentRowSelectionData

  const selectedFolders = useSelectedFolders({
    rowSelection,
    sliceType,
    persistentRowSelectionData: persistedHierarchySelection,
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
    filters: combinedFilters,
    queryFilters,
    expanded,
    sorting: columnSorting,
    groupBy,
    taskGroups,
    showHierarchy,
    attribFields,
    modules,
  })

  // combine foldersMap and tasksMap into a single map
  const entitiesMap = useEntitiesMap({ foldersMap, tasksMap })

  const error = extractErrorMessage(groupingError)

  return (
    <ProjectOverviewContext.Provider
      value={{
        isInitialized: isInitialized && isConfigReady,
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
        // filters
        filters,
        setFilters,
        queryFilters,
        // hierarchy
        showHierarchy,
        updateShowHierarchy,
        // expanded state
        expanded,
        expandedIds,
        toggleExpanded,
        updateExpanded,
        setExpanded,
        // sorting
        sorting: columnSorting,
        updateSorting,
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
