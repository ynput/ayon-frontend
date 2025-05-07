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
import type { QueryTasksFoldersApiArg } from '@shared/api'
import { ProjectDataContextProps, useProjectDataContext } from './ProjectDataContext'
import { LoadingTasks } from '@shared/containers/ProjectTreeTable'

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
  // Data
  tasksMap: TaskNodeMap
  foldersMap: FolderNodeMap
  tasksByFolderMap: TasksByFolderMap
  fetchNextPage: () => void
  reloadTableData: () => void

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
    columnSorting,
    setColumnSorting,
  } = useProjectDataContext()

  const getLocalKey = (page: string, key: string) => `${page}-${key}-${projectName}`

  const page = 'overview'

  const [expanded, setExpanded] = useLocalStorage<ExpandedState>(getLocalKey(page, 'expanded'), {})
  const updateExpanded: OnChangeFn<ExpandedState> = (expandedUpdater) => {
    setExpanded(functionalUpdate(expandedUpdater, expanded))
  }

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

  const { filter: sliceFilter } = useFilterBySlice()

  // merge the slice filter with the user filters
  let combinedFilters = [...filters]
  if (sliceFilter?.values?.length) {
    combinedFilters.push(sliceFilter as Filter)
  }

  // transform the task bar filters to the query format
  // TODO: filters bar just uses the same schema as the server
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
    queryFilters,
    expanded,
    sorting: columnSorting,
    showHierarchy,
  })

  return (
    <ProjectOverviewContext.Provider
      value={{
        isInitialized,
        isLoading: isLoadingAll || isLoadingData,
        isLoadingMore,
        loadingTasks,
        projectInfo,
        attribFields,
        users,
        projectName,
        tasksMap,
        foldersMap,
        tasksByFolderMap,
        fetchNextPage,
        reloadTableData,
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
