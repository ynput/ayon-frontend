import { EntityGroup, QueryTasksFoldersApiArg } from '@shared/api'
import { FolderNodeMap, LoadingTasks, TaskNodeMap, TasksByFolderMap } from '.'
import { ProjectDataContextProps } from '../context'
import { ExpandedState, OnChangeFn } from '@tanstack/react-table'
import { ContextMenuItemConstructors, ProjectTableModulesType } from '../hooks'
import { ReactNode } from 'react'
import { QueryFilter } from './operations'

interface EntityMoveData {
  entityId: string
  entityType: 'folder'
}

export interface ProjectOverviewProviderProps {
  children: ReactNode
  modules: ProjectTableModulesType
}

export interface ProjectOverviewContextType {
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

  // Query Filters
  queryFilters: {
    filter: QueryTasksFoldersApiArg['tasksFoldersQuery']['filter']
    filterString?: string
    search: QueryTasksFoldersApiArg['tasksFoldersQuery']['search']
  }
  setQueryFilters: (queryFilters: QueryFilter) => void

  // Dual filtering system
  combinedFilters: QueryFilter // For data fetching (includes slice filters)
  displayFilters: QueryFilter // For SearchFilterWrapper (excludes slice filters, except hierarchy)

  // Hierarchy
  showHierarchy: boolean
  updateShowHierarchy: (showHierarchy: boolean) => void

  // Expanded state
  expanded: ExpandedState
  expandedIds: string[]
  toggleExpanded: (id: string) => void
  updateExpanded: OnChangeFn<ExpandedState>
  setExpanded: (expanded: ExpandedState) => void

  // context menu items
  contextMenuItems: ContextMenuItemConstructors

  // move dialog
  openMoveDialog?: (entityData: EntityMoveData) => void
}
