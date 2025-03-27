import { createContext, ReactNode, useCallback, useContext, useMemo } from 'react'
import {
  ColumnOrderState,
  ColumnPinningState,
  ExpandedState,
  functionalUpdate,
  OnChangeFn,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table'
import useLocalStorage from '@hooks/useLocalStorage'
import useFetchAndUpdateEntityData from '../hooks/useFetchEditorEntities'
import useOverviewTable from '../hooks/useOverviewTable'
import { useAppSelector } from '@state/store'
import { useSlicerContext } from '@context/slicerContext'
import { isEmpty } from 'lodash'
import useFilterBySlice from '@containers/TasksProgress/hooks/useFilterBySlice'
import { Filter } from '@ynput/ayon-react-components'
import { useGetProjectQuery } from '@queries/project/getProject'
import {
  EditorTaskNode,
  FolderNodeMap,
  MatchingFolder,
  TableRow,
  TaskNodeMap,
} from '../utils/types'
import { ProjectModel } from '@api/rest/project'
import useAttributeFields from '../hooks/useAttributesList'
import { AttributeModel } from '@api/rest/attributes'
import useFolderRelationships from '../hooks/useFolderRelationships'
import { RowId } from '../utils/cellUtils'
import clientFilterToQueryFilter from '../utils/clientFilterToQueryFilter'
import { QueryTasksFoldersApiArg } from '@api/rest/folders'
import { useGetUsersAssigneeQuery } from '@queries/user/getUsers'

export type InheritedDependent = {
  entityId: string
  entityType: 'task' | 'folder'
  inheritedAttribs: string[]
}

type User = {
  name: string
  fullName: string
}

export interface ProjectTableContextProps {
  isInitialized: boolean
  isLoading: boolean
  // Project Info
  projectInfo?: ProjectModel
  projectName: string
  users: User[]

  // Data
  tableData: TableRow[]
  tasksMap: TaskNodeMap
  foldersMap: FolderNodeMap
  fetchNextPage: () => void
  getEntityById: (id: string) => MatchingFolder | EditorTaskNode | undefined

  // Attributes
  attribFields: AttributeModel[]

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
  updateExpanded: OnChangeFn<ExpandedState>
  toggleExpandAll: (rowId: RowId[], expand?: boolean) => void

  // Sorting
  sorting: SortingState
  updateSorting: OnChangeFn<SortingState>

  // Column Visibility
  columnVisibility: VisibilityState
  setColumnVisibility: (columnVisibility: VisibilityState) => void
  updateColumnVisibility: (columnVisibility: VisibilityState) => void
  columnVisibilityUpdater: OnChangeFn<VisibilityState>

  // Column Pinning
  columnPinning: ColumnPinningState
  setColumnPinning: (columnPinning: ColumnPinningState) => void
  updateColumnPinning: (columnPinning: ColumnPinningState) => void
  columnPinningUpdater: OnChangeFn<ColumnPinningState>

  // Column Order
  columnOrder: ColumnOrderState
  setColumnOrder: (columnOrder: ColumnOrderState) => void
  updateColumnOrder: (columnOrder: ColumnOrderState) => void
  columnOrderUpdater: OnChangeFn<ColumnOrderState>

  // Folder Relationships
  getInheritedDependents: (entities: { id: string; attribs: string[] }[]) => InheritedDependent[]
}

const ProjectTableContext = createContext<ProjectTableContextProps | undefined>(undefined)

interface ProjectTableProviderProps {
  children: ReactNode
}

export const ProjectTableProvider = ({ children }: ProjectTableProviderProps) => {
  const projectName = useAppSelector((state) => state.project.name) || ''
  const scope = `overview-${projectName}`

  // GET PROJECT DATA
  const {
    data: projectInfo,
    isSuccess: isSuccessProject,
    isFetching: isFetchingProject,
  } = useGetProjectQuery({ projectName }, { skip: !projectName })
  const { folderTypes = [], taskTypes = [] } = projectInfo || {}

  const {
    attribFields,
    isSuccess: isSuccessAttribs,
    isFetching: isFetchingAttribs,
  } = useAttributeFields()

  const isInitialized =
    isSuccessProject && isSuccessAttribs && !isFetchingProject && !isFetchingAttribs

  const { data: usersData = [] } = useGetUsersAssigneeQuery({ projectName }, { skip: !projectName })
  const users = usersData as User[]

  const [expanded, setExpanded] = useLocalStorage<ExpandedState>(`expanded-${scope}`, {})
  const updateExpanded: OnChangeFn<ExpandedState> = (expandedUpdater) => {
    setExpanded(functionalUpdate(expandedUpdater, expanded))
  }

  const [filters, setFilters] = useLocalStorage<Filter[]>(`overview-filters-${projectName}`, [])
  const [showHierarchy, updateShowHierarchy] = useLocalStorage<boolean>(
    `overview-show-hierarchy-${projectName}`,
    true,
  )

  const { filter: sliceFilter } = useFilterBySlice()

  // merge the slice filter with the user filters
  let combinedFilters = [...filters]
  if (sliceFilter?.values?.length) {
    combinedFilters.push(sliceFilter)
  }

  // transform the task bar filters to the query format
  // TODO: filters bar just uses the same schema as the server
  const queryFilter = clientFilterToQueryFilter(combinedFilters)
  const queryFilterString = filters.length ? JSON.stringify(queryFilter) : ''
  // extract the fuzzy search from the filters
  const fuzzySearchFilter = combinedFilters.find((filter) => filter.id.includes('text'))
    ?.values?.[0]?.id

  const queryFilters = {
    filterString: queryFilterString,
    filter: queryFilter,
    search: fuzzySearchFilter,
  }

  const [sorting, setSorting] = useLocalStorage<SortingState>(`sorting-${scope}`, [
    {
      id: 'name',
      desc: true,
    },
  ])

  const updateSorting: OnChangeFn<SortingState> = (sortingUpdater) => {
    setSorting(functionalUpdate(sortingUpdater, sorting))
  }

  // COLUMN VISIBILITY
  const [columnVisibility, setColumnVisibility] = useLocalStorage<VisibilityState>(
    `overview-column-visibility-${scope}`,
    {},
  )

  // COLUMN ORDER
  const [columnOrder, setColumnOrder] = useLocalStorage<ColumnOrderState>(
    `column-order-${scope}`,
    [],
  )

  // COLUMN PINNING
  const [columnPinning, setColumnPinning] = useLocalStorage<ColumnPinningState>(
    `column-pinning-${scope}`,
    { left: ['name'] },
  )

  const togglePinningOnVisibilityChange = (visibility: VisibilityState) => {
    // ensure that any columns that are now hidden are removed from the pinning
    const newPinning = { ...columnPinning }
    const pinnedColumns = newPinning.left || []
    const hiddenColumns = Object.keys(visibility).filter((col) => visibility[col] === false)
    const newPinnedColumns = pinnedColumns.filter((col) => !hiddenColumns.includes(col))
    const newColumnPinning = {
      ...newPinning,
      left: newPinnedColumns,
    }
    setColumnPinning(newColumnPinning)
  }

  // COLUMN VISIBILITY
  const columnVisibilityUpdater: OnChangeFn<VisibilityState> = (columnVisibilityUpdater) => {
    setColumnVisibility(functionalUpdate(columnVisibilityUpdater, columnVisibility))
    // side effects
    togglePinningOnVisibilityChange(columnVisibility)
  }

  // update the column visibility
  const updateColumnVisibility = (visibility: VisibilityState) => {
    setColumnVisibility(visibility)
    // side effects
    togglePinningOnVisibilityChange(visibility)
  }

  const updatePinningOrderOnOrderChange = (columnOrder: ColumnOrderState) => {
    // ensure that the column pinning is in the order of the column order
    const newPinning = { ...columnPinning }
    const pinnedColumns = newPinning.left || []
    const pinnedColumnsOrder = columnOrder.filter((col) => pinnedColumns.includes(col))
    setColumnPinning({
      ...newPinning,
      left: pinnedColumnsOrder,
    })
  }

  const columnOrderUpdater: OnChangeFn<ColumnOrderState> = (columnOrderUpdater) => {
    setColumnOrder(functionalUpdate(columnOrderUpdater, columnOrder))
    // now update the column pinning
    updatePinningOrderOnOrderChange(columnOrder)
  }

  const updateColumnOrder = (columnOrder: ColumnOrderState) => {
    setColumnOrder(columnOrder)
    // now update the column pinning
    updatePinningOrderOnOrderChange(columnOrder)
  }

  // COLUMN PINNING
  const updateOrderOnPinningChange = (columnPinning: ColumnPinningState) => {
    // we resort the column order based on the pinning
    const newOrder = [...columnOrder].sort((a, b) => {
      const aPinned = columnPinning.left?.includes(a) ? 1 : 0
      const bPinned = columnPinning.left?.includes(b) ? 1 : 0

      return bPinned - aPinned
    })
    setColumnOrder(newOrder)
  }

  const updateColumnPinning = (columnPinning: ColumnPinningState) => {
    setColumnPinning(columnPinning)
    // now update the column order
    updateOrderOnPinningChange(columnPinning)
  }

  const columnPinningUpdater: OnChangeFn<ColumnPinningState> = (columnPinningUpdater) => {
    const newPinning = functionalUpdate(columnPinningUpdater, columnPinning)
    setColumnPinning(newPinning)
    // now update the column order
    updateOrderOnPinningChange(newPinning)
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
    isLoadingAll,
    isLoadingMore,
    loadingTasks,
  } = useFetchAndUpdateEntityData({
    projectName,
    selectedFolders,
    queryFilters,
    expanded,
    sorting,
    showHierarchy,
  })

  // DATA TO TABLE
  const tableData = useOverviewTable({
    foldersMap,
    tasksMap,
    tasksByFolderMap,
    expanded,
    folderTypes,
    taskTypes,
    showHierarchy,
    loadingTasks,
    isLoadingMore,
  })

  const getEntityById = useCallback(
    (id: string): MatchingFolder | EditorTaskNode | undefined => {
      // Check if it's a folder
      if (foldersMap.has(id)) {
        return foldersMap.get(id)
      }
      // Check if it's a task
      if (tasksMap.has(id)) {
        return tasksMap.get(id)
      }
      // Return undefined if not found
      return undefined
    },
    [foldersMap, tasksMap],
  )

  // get folder relationship functions
  const { getInheritedDependents, getChildrenEntities } = useFolderRelationships({
    foldersMap,
    tasksMap,
    tasksByFolderMap,
  })

  const toggleExpandAll: ProjectTableContextProps['toggleExpandAll'] = (rowIds, expandAll) => {
    const expandedState = typeof expanded === 'object' ? expanded : {}

    const newExpandedState = { ...expandedState }

    rowIds.forEach((rowId) => {
      // get all children of the rowId using tableData
      const childIds = getChildrenEntities(rowId).map((child) => child.id)
      // check if the rowId is expanded
      const isExpanded = expandedState[rowId] || false

      if (expandAll !== undefined ? !expandAll : isExpanded) {
        // collapse all children
        newExpandedState[rowId] = false
        childIds.forEach((id) => {
          newExpandedState[id] = false
        })
      } else {
        // expand all children
        newExpandedState[rowId] = true
        childIds.forEach((id) => {
          newExpandedState[id] = true
        })
      }
    })

    setExpanded(newExpandedState)
  }

  return (
    <ProjectTableContext.Provider
      value={{
        isInitialized,
        isLoading: isLoadingAll,
        projectInfo,
        attribFields,
        users,
        projectName,
        tableData,
        tasksMap,
        foldersMap,
        fetchNextPage,
        // filters
        filters,
        setFilters,
        queryFilters,
        // hierarchy
        showHierarchy,
        updateShowHierarchy,
        // expanded state
        expanded,
        updateExpanded,
        toggleExpandAll,
        // sorting
        sorting,
        updateSorting,
        // column visibility
        columnVisibility,
        setColumnVisibility,
        updateColumnVisibility,
        columnVisibilityUpdater,
        // column pinning
        columnPinning,
        setColumnPinning,
        updateColumnPinning,
        columnPinningUpdater,
        // column order
        columnOrder,
        setColumnOrder,
        updateColumnOrder,
        columnOrderUpdater,
        getEntityById,
        getInheritedDependents,
      }}
    >
      {children}
    </ProjectTableContext.Provider>
  )
}

export const useProjectTableContext = () => {
  const context = useContext(ProjectTableContext)
  if (!context) {
    throw new Error('useProjectTableContext must be used within a ProjectTableProvider')
  }
  return context
}
