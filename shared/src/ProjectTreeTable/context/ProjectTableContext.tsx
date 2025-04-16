import { createContext, ReactNode, useCallback, useContext, useMemo } from 'react'
import { ExpandedState, OnChangeFn, SortingState } from '@tanstack/react-table'
import useOverviewTable from '../hooks/useOverviewTable'
import { Filter } from '@ynput/ayon-react-components'
import {
  EditorTaskNode,
  FolderNodeMap,
  MatchingFolder,
  TableRow,
  TaskNodeMap,
  TasksByFolderMap,
} from '../types/table'
import useFolderRelationships, {
  FindInheritedValueFromAncestors,
  GetAncestorsOf,
  GetInheritedDependents,
  FindNonInheritedValues,
} from '../hooks/useFolderRelationships'
import { RowId } from '../utils/cellUtils'
import { ProjectModel } from '../types/project'
import { AttributeWithPermissions, LoadingTasks } from '../types'
import { QueryFilter } from '../types/folders'
import { OperationModel, OperationsRequestModel } from '../types/operations'

type User = {
  name: string
  fullName?: string
}

export interface ProjectTableContextProps {
  isInitialized: ProjectTableProviderProps['isInitialized']
  isLoading: ProjectTableProviderProps['isLoading']
  // Project Info
  projectInfo: ProjectTableProviderProps['projectInfo']
  projectName: ProjectTableProviderProps['projectName']
  users: ProjectTableProviderProps['users']
  // Attributes
  attribFields: ProjectTableProviderProps['attribFields']

  // Data
  tableData: TableRow[]
  tasksMap: ProjectTableProviderProps['tasksMap']
  foldersMap: ProjectTableProviderProps['foldersMap']
  fetchNextPage: ProjectTableProviderProps['fetchNextPage']
  reloadTableData: ProjectTableProviderProps['reloadTableData']
  getEntityById: (id: string) => MatchingFolder | EditorTaskNode | undefined

  // Filters
  filters: ProjectTableProviderProps['filters']
  setFilters: ProjectTableProviderProps['setFilters']
  queryFilters: ProjectTableProviderProps['queryFilters']

  // Hierarchy
  showHierarchy: ProjectTableProviderProps['showHierarchy']
  updateShowHierarchy: ProjectTableProviderProps['updateShowHierarchy']

  // Expanded state
  expanded: ProjectTableProviderProps['expanded']
  toggleExpanded: ProjectTableProviderProps['toggleExpanded']
  updateExpanded: ProjectTableProviderProps['updateExpanded']
  toggleExpandAll: (rowId: RowId[], expand?: boolean) => void

  // Sorting
  sorting: ProjectTableProviderProps['sorting']
  updateSorting: ProjectTableProviderProps['updateSorting']

  // Folder Relationships
  getInheritedDependents: GetInheritedDependents
  findInheritedValueFromAncestors: FindInheritedValueFromAncestors
  findNonInheritedValues: FindNonInheritedValues
  getAncestorsOf: GetAncestorsOf
}

const ProjectTableContext = createContext<ProjectTableContextProps | undefined>(undefined)

export interface ProjectTableProviderProps {
  children: ReactNode
  isInitialized: boolean

  // loading
  isLoading: boolean
  isLoadingMore: boolean
  loadingTasks: LoadingTasks
  // Project Info
  projectInfo?: ProjectModel
  projectName: string
  users: User[]
  // Attributes
  attribFields: AttributeWithPermissions[]

  // data
  tasksMap: TaskNodeMap
  foldersMap: FolderNodeMap
  tasksByFolderMap: TasksByFolderMap
  // data functions
  fetchNextPage: () => void
  reloadTableData: () => void

  // Filters
  filters: Filter[]
  setFilters: (filters: Filter[]) => void
  queryFilters: {
    filter: QueryFilter | undefined
    filterString?: string
    search: string | undefined
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

export const ProjectTableProvider = ({
  children,
  foldersMap,
  tasksMap,
  tasksByFolderMap,
  expanded,
  projectInfo,
  showHierarchy,
  loadingTasks,
  isLoadingMore,
  isLoading,
  isInitialized,
  projectName,
  users,
  attribFields,
  filters,
  setFilters,
  queryFilters,
  updateShowHierarchy,
  toggleExpanded,
  updateExpanded,
  sorting,
  updateSorting,
  fetchNextPage,
  reloadTableData,
  setExpanded,
}: ProjectTableProviderProps) => {
  const { folderTypes, taskTypes } = projectInfo || {}

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
  const {
    getInheritedDependents,
    getChildrenEntities,
    findInheritedValueFromAncestors,
    findNonInheritedValues,
    getAncestorsOf,
  } = useFolderRelationships({
    foldersMap,
    tasksMap,
    tasksByFolderMap,
    getEntityById,
    projectAttrib: projectInfo?.attrib,
    attribFields: attribFields,
  })

  const toggleExpandAll: ProjectTableContextProps['toggleExpandAll'] = useCallback(
    (rowIds, expandAll) => {
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
    },
    [expanded, getChildrenEntities, setExpanded],
  )

  return (
    <ProjectTableContext.Provider
      value={{
        // from this context
        tableData,
        // forwarded on
        isInitialized,
        isLoading,
        projectInfo,
        attribFields,
        users,
        projectName,
        tasksMap,
        foldersMap,
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
        toggleExpandAll,
        // sorting
        sorting,
        updateSorting,
        getEntityById,
        // folder relationships
        getInheritedDependents,
        findInheritedValueFromAncestors,
        findNonInheritedValues,
        getAncestorsOf,
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
