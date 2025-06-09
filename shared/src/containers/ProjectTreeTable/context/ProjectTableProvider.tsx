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
import { ReactNode, useCallback, useMemo } from 'react'
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
import { AttributeModel, EntityGroup } from '@shared/api'
import useBuildGroupByTableData, {
  GroupByEntityType,
  ROW_ID_SEPARATOR,
} from '../hooks/useBuildGroupByTableData'
import { PowerpackContextType } from '@shared/context'
import { useColumnSettingsContext } from './ColumnSettingsContext'
import { ProjectTableModulesType } from '../hooks'
import { ProjectTableContext, ProjectTableContextType } from './ProjectTableContext'

export const parseRowId = (rowId: string) => rowId?.split(ROW_ID_SEPARATOR)[0] || rowId

export type TableUser = {
  name: string
  fullName?: string
}

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
  scopes: string[]

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
  modules: ProjectTableModulesType

  groupByConfig?: {
    entityType?: GroupByEntityType
  }
}

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
  scopes,
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
  const { groupBy, groupByConfig: { showEmpty: showEmptyGroups = false } = {} } =
    useColumnSettingsContext()

  const buildGroupByTableData = useBuildGroupByTableData({
    entities: entitiesMap,
    entityType: groupByConfig?.entityType,
    groups: taskGroups,
    project: projectInfo,
    attribFields,
    showEmpty: showEmptyGroups,
  })

  // if we are grouping by something, we ignore current tableData and format the data based on the groupBy
  const groupedTableData = useMemo(
    () => !!groupBy && buildGroupByTableData(groupBy),
    [groupBy, entitiesMap, taskGroups],
  )

  const tableData = groupBy && groupedTableData ? groupedTableData : defaultTableData

  const getEntityById = useCallback(
    (id: string): EntityMap | undefined => {
      // defensive check to ensure id is a string
      if (typeof id !== 'string') {
        console.warn('getEntityById called with non-string id:', id)
        return undefined
      }
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

  const toggleExpandAll: ProjectTableContextType['toggleExpandAll'] = useCallback(
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

  const toggleExpands: ProjectTableContextType['toggleExpands'] = useCallback(
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
        scopes,
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
