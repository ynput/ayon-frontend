/**
 * Project Table Context
 *
 * This context serves as the central data management layer for the project table component.
 * It performs three main functions:
 *
 * 1. **Props Forwarding**: Acts as a bridge to forward essential props (project info, users,
 *    attributes, filters, etc.) down to child components throughout the table hierarchy.
 *
 * 2. **Table Data Structure Building**: Transforms raw project data into structured table rows
 *    that can be consumed by the table component. This includes processing folders, tasks,
 *    and entities into a unified table format.
 *
 * 3. **Multi-Modal Data Presentation**: Supports three different data presentation modes:
 *    - **Hierarchy Mode**: Builds nested folder/task relationships with expandable rows
 *    - **Tasks List Mode**: Flattened view of tasks without hierarchical structure
 *    - **Groups Mode**: Groups entities by specified criteria (entity type, custom groups)
 *
 * The context also provides utility functions for entity relationships, expansion state
 * management, filtering, sorting, and folder inheritance operations.
 */
import { createContext, ReactNode, useCallback, useContext, useMemo } from 'react'
import { ExpandedState, OnChangeFn, SortingState } from '@tanstack/react-table'
import useBuildProjectDataTable from '../hooks/useBuildProjectDataTable'
import { Filter } from '@ynput/ayon-react-components'
import {
  EntitiesMap,
  EntityMap,
  FolderNodeMap,
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
import { ProjectTableAttribute, LoadingTasks } from '../types'
import { QueryFilter } from '../types/folders'
import { ContextMenuItemConstructors } from '../hooks/useCellContextMenu'
import { EntityGroup } from '@shared/api'
import useBuildGroupByTableData, {
  GroupByEntityType,
  ROW_ID_SEPARATOR,
} from '../hooks/useBuildGroupByTableData'
import { PowerpackContextType } from '@shared/context'
import { ProjectTableModuleContextType } from './ProjectTableModulesContext'
import { useColumnSettingsContext } from './ColumnSettingsContext'

export const parseRowId = (rowId: string) => rowId.split(ROW_ID_SEPARATOR)[0] || rowId

export type TableUser = {
  name: string
  fullName?: string
}

export type ToggleExpandAll = (rowIds: RowId[], expand?: boolean) => void
export type ToggleExpands = (rowIds: RowId[], expand?: boolean) => void

export interface ProjectTableProviderProps {
  children: ReactNode
  isInitialized: boolean

  // loading
  isLoading: boolean
  isLoadingMore: boolean
  loadingTasks?: LoadingTasks
  error?: string
  // Project Info
  projectInfo?: ProjectModel
  projectName: string
  users: TableUser[]
  // Attributes
  attribFields: ProjectTableAttribute[]

  // data
  tasksMap: TaskNodeMap
  foldersMap: FolderNodeMap
  entitiesMap: EntitiesMap
  tasksByFolderMap: TasksByFolderMap
  tableRows?: TableRow[] // any extra rows that we want to add to the table

  // grouping
  taskGroups: EntityGroup[]

  // data functions
  fetchNextPage: (value?: string) => void
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

  // context menu
  contextMenuItems: ContextMenuItemConstructors

  // powerpack context
  powerpack?: PowerpackContextType

  // remote modules
  modules: ProjectTableModuleContextType

  groupByConfig?: {
    entityType?: GroupByEntityType
  }
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
  error?: string

  // Data
  tableData: TableRow[]
  tasksMap: ProjectTableProviderProps['tasksMap']
  foldersMap: ProjectTableProviderProps['foldersMap']
  entitiesMap: ProjectTableProviderProps['entitiesMap']
  fetchNextPage: ProjectTableProviderProps['fetchNextPage']
  reloadTableData: ProjectTableProviderProps['reloadTableData']
  getEntityById: (id: string) => EntityMap | undefined

  // grouping
  taskGroups: ProjectTableProviderProps['taskGroups']

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
  toggleExpandAll: ToggleExpandAll
  toggleExpands: ToggleExpands // expand/collapse multiple rows at once

  // Sorting
  sorting: ProjectTableProviderProps['sorting']
  updateSorting: ProjectTableProviderProps['updateSorting']

  // Folder Relationships
  getInheritedDependents: GetInheritedDependents
  findInheritedValueFromAncestors: FindInheritedValueFromAncestors
  findNonInheritedValues: FindNonInheritedValues
  getAncestorsOf: GetAncestorsOf

  // Context menu
  contextMenuItems: ProjectTableProviderProps['contextMenuItems']

  // Powerpack context
  powerpack?: ProjectTableProviderProps['powerpack']

  // remote modules
  modules: ProjectTableProviderProps['modules']
}

const ProjectTableContext = createContext<ProjectTableContextProps | undefined>(undefined)

export const ProjectTableProvider = ({
  children,
  foldersMap,
  tableRows,
  tasksMap,
  entitiesMap,
  tasksByFolderMap,
  expanded,
  projectInfo,
  showHierarchy,
  loadingTasks,
  isLoadingMore,
  isLoading,
  error,
  isInitialized,
  projectName,
  users,
  attribFields,
  taskGroups,
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
  contextMenuItems,
  powerpack,
  modules,
  groupByConfig,
}: ProjectTableProviderProps) => {
  // DATA TO TABLE
  const defaultTableData = useBuildProjectDataTable({
    foldersMap,
    tasksMap,
    rows: tableRows,
    tasksByFolderMap,
    expanded,
    projectInfo,
    showHierarchy,
    loadingTasks,
    isLoadingMore,
  })
  const { groupBy } = useColumnSettingsContext()

  const buildGroupByTableData = useBuildGroupByTableData({
    entities: entitiesMap,
    entityType: groupByConfig?.entityType,
    groups: taskGroups,
    project: projectInfo,
    attribFields,
  })

  // if we are grouping by something, we ignore current tableData and format the data based on the groupBy
  const groupedTableData = useMemo(
    () => !!groupBy && buildGroupByTableData(groupBy),
    [groupBy, entitiesMap, taskGroups],
  )

  const tableData = groupBy && groupedTableData ? groupedTableData : defaultTableData

  const getEntityById = useCallback(
    (id: string): EntityMap | undefined => {
      // always parse the id to remove any suffixes
      // this can happen if the id is a group by id (we need to make the row id unique)
      const parsedId = parseRowId(id)
      if (foldersMap.has(parsedId)) {
        return foldersMap.get(parsedId)
      } else if (tasksMap.has(parsedId)) {
        return tasksMap.get(parsedId)
      } else if (entitiesMap.has(parsedId)) {
        return entitiesMap.get(parsedId)
      }

      // Return undefined if not found
      return undefined
    },
    [foldersMap, tasksMap, entitiesMap],
  )

  // get folder relationship functions
  const {
    getInheritedDependents,
    getChildrenEntities,
    findInheritedValueFromAncestors,
    findNonInheritedValues,
    getAncestorsOf,
  } = useFolderRelationships({
    entitiesMap,
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

  const toggleExpands: ProjectTableContextProps['toggleExpands'] = useCallback(
    (rowIds, expand) => {
      const expandedState = typeof expanded === 'object' ? expanded : {}
      const newExpandedState = { ...expandedState }

      rowIds.forEach((rowId) => {
        if (expand !== undefined) {
          // Use the provided expand parameter
          newExpandedState[rowId] = expand
        } else {
          // Toggle based on current state
          newExpandedState[rowId] = !expandedState[rowId]
        }
      })

      setExpanded(newExpandedState)
    },
    [expanded, setExpanded],
  )

  return (
    <ProjectTableContext.Provider
      value={{
        // from this context
        tableData,
        // forwarded on
        isInitialized,
        isLoading,
        error,
        projectInfo,
        attribFields,
        users,
        projectName,
        tasksMap,
        foldersMap,
        entitiesMap,
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
        toggleExpandAll,
        toggleExpands,
        // sorting
        sorting,
        updateSorting,
        getEntityById,
        // folder relationships
        getInheritedDependents,
        findInheritedValueFromAncestors,
        findNonInheritedValues,
        getAncestorsOf,
        // context menu
        contextMenuItems,
        // powerpack context
        powerpack,
        modules,
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
