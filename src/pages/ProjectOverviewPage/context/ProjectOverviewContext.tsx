import { createContext, ReactNode, useContext, useMemo } from 'react'
import {
  ExpandedState,
  functionalUpdate,
  OnChangeFn,
  RowSelectionState,
  SortingState,
} from '@tanstack/react-table'
import { useLocalStorage } from '@shared/hooks'
import useFetchOverviewData from '../hooks/useFetchOverviewData'
import { useSlicerContext } from '@context/SlicerContext'
import { isEmpty } from 'lodash'
import useFilterBySlice from '@containers/TasksProgress/hooks/useFilterBySlice'
import { Filter } from '@ynput/ayon-react-components'
import type {
  FolderNodeMap,
  TaskNodeMap,
  TasksByFolderMap,
} from '@shared/containers/ProjectTreeTable/utils'
import { clientFilterToQueryFilter } from '@shared/containers/ProjectTreeTable/utils'
import { EntityGroup, useGetEntityGroupsQuery, type QueryTasksFoldersApiArg } from '@shared/api'
import {
  LoadingTasks,
  ProjectDataContextProps,
  TableGroupBy,
  useProjectDataContext,
} from '@shared/containers/ProjectTreeTable'
import { ContextMenuItemConstructors } from '@shared/containers/ProjectTreeTable/hooks/useCellContextMenu'
import { useUserProjectConfig } from '@shared/hooks'
import useOverviewContextMenu from '../hooks/useOverviewContextMenu'

export interface ProjectOverviewContextProps {
  isInitialized: boolean
  // Project Info
  projectInfo?: ProjectDataContextProps['projectInfo']
  projectName: string
  users: ProjectDataContextProps['users']
  // Attributes
  attribFields: ProjectDataContextProps['attribFields']

  // loading
  isLoading: boolean
  isLoadingMore: boolean
  loadingTasks: LoadingTasks
  error?: string
  // Data
  tasksMap: TaskNodeMap
  foldersMap: FolderNodeMap
  entitiesMap: FolderNodeMap & TaskNodeMap
  tasksByFolderMap: TasksByFolderMap
  fetchNextPage: (value?: string) => void
  reloadTableData: () => void

  // Grouping data
  taskGroups: EntityGroup[]

  // Filters
  filters: Filter[]
  setFilters: (filters: Filter[]) => void
  queryFilters: {
    filter: QueryTasksFoldersApiArg['tasksFoldersQuery']['filter']
    filterString?: string
    search: QueryTasksFoldersApiArg['tasksFoldersQuery']['search']
  }

  // Hierarchy
  showHierarchy: boolean
  updateShowHierarchy: (showHierarchy: boolean) => void

  // Expanded state
  expanded: ExpandedState
  toggleExpanded: (id: string) => void
  updateExpanded: OnChangeFn<ExpandedState>
  setExpanded: (expanded: ExpandedState) => void

  // Sorting
  sorting: SortingState
  updateSorting: OnChangeFn<SortingState>

  // context menu items
  contextMenuItems: ContextMenuItemConstructors
}

const ProjectOverviewContext = createContext<ProjectOverviewContextProps | undefined>(undefined)

interface ProjectOverviewProviderProps {
  children: ReactNode
}

export const ProjectOverviewProvider = ({ children }: ProjectOverviewProviderProps) => {
  // Get project data from the new context
  const {
    projectName,
    projectInfo,
    attribFields,
    users,
    isInitialized,
    isLoading: isLoadingData,
  } = useProjectDataContext()

  // filter out attribFields by scope
  const scopedAttribFields = useMemo(
    () =>
      attribFields.filter((field) => ['task', 'folder'].some((s: any) => field.scope?.includes(s))),
    [attribFields],
  )

  const contextMenuItems = useOverviewContextMenu({})

  const getLocalKey = (page: string, key: string) => `${page}-${key}-${projectName}`

  const page = 'overview'

  const [expanded, setExpanded] = useLocalStorage<ExpandedState>(getLocalKey(page, 'expanded'), {})
  const updateExpanded: OnChangeFn<ExpandedState> = (expandedUpdater) => {
    setExpanded(functionalUpdate(expandedUpdater, expanded))
  }

  // Get column sorting
  const [pageConfig, updatePageConfig, { isSuccess: isConfigReady }] = useUserProjectConfig({
    selectors: ['overview', projectName],
  })

  const toggleExpanded = (id: string) => {
    if (typeof expanded === 'boolean') return
    setExpanded({
      ...expanded,
      [id]: !expanded[id],
    })
  }

  const [filters, setFilters] = useLocalStorage<Filter[]>(getLocalKey(page, 'filters'), [])
  const [showHierarchy, updateShowHierarchy] = useLocalStorage<boolean>(
    getLocalKey(page, 'showHierarchy'),
    true,
  )

  let { columnSorting = [], groupBy } = pageConfig as {
    columnSorting: SortingState
    groupBy?: TableGroupBy
  }

  const { filter: sliceFilter } = useFilterBySlice()

  // merge the slice filter with the user filters
  let combinedFilters = [...filters]
  if (sliceFilter?.values?.length) {
    combinedFilters.push(sliceFilter as Filter)
  }

  // GROUPING
  // 1. get groups data
  // 2. add that filter to the combined filter
  // 3. sort by that filter
  const groupingKey = (groupBy?.id || '').replace('attrib_', 'attrib.')
  const { data: { groups: taskGroups = [] } = {}, error: groupingError } = useGetEntityGroupsQuery(
    { projectName, entityType: 'task', groupingKey: groupingKey, empty: true },
    { skip: !groupBy?.id },
  )

  // transform the task bar filters to the query format
  const queryFilter = clientFilterToQueryFilter(combinedFilters)
  const queryFilterString = combinedFilters.length ? JSON.stringify(queryFilter) : ''
  // extract the fuzzy search from the filters
  const fuzzySearchFilter = combinedFilters.find((filter) => filter.id.includes('text'))
    ?.values?.[0]?.id

  const queryFilters = {
    filterString: queryFilterString,
    filter: queryFilter,
    search: fuzzySearchFilter,
  }

  const setColumnSorting = async (sorting: SortingState) => {
    await updatePageConfig({ columnSorting: sorting })
  }

  // update in user preferences
  const updateSorting: OnChangeFn<SortingState> = (sortingUpdater) => {
    setColumnSorting(functionalUpdate(sortingUpdater, columnSorting))
  }

  const { rowSelection, sliceType, persistentRowSelectionData } = useSlicerContext()

  // filter out by slice
  const persistedHierarchySelection = isEmpty(persistentRowSelectionData)
    ? null
    : persistentRowSelectionData

  const selectedFolders = useMemo(() => {
    let selection: RowSelectionState = {}

    if (sliceType === 'hierarchy') {
      selection = rowSelection
    } else if (persistedHierarchySelection) {
      selection = Object.values(persistedHierarchySelection).reduce((acc: any, item) => {
        acc[item.id] = !!item
        return acc
      }, {})
    }

    // Process the selection inside useMemo
    return Object.entries(selection)
      .filter(([, value]) => value)
      .map(([id]) => id)
  }, [rowSelection, persistedHierarchySelection, sliceType])

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
  })

  // combine foldersMap and itemsMap into a single map
  const entitiesMap = useMemo(() => {
    const combined: FolderNodeMap & TaskNodeMap = new Map()

    foldersMap.forEach((folder) => {
      combined.set(folder.id, folder)
    })

    tasksMap.forEach((task) => {
      combined.set(task.id, task)
    })

    return combined
  }, [foldersMap, tasksMap])

  // @ts-expect-error = it's always data.detail
  const error = groupingError?.data?.detail

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
