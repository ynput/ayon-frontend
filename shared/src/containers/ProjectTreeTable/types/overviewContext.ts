import { EntityGroup, QueryTasksFoldersApiArg } from '@shared/api'
import { FolderNodeMap, LoadingTasks, TaskNodeMap, TasksByFolderMap } from '.'
import { ProjectDataContextProps, ProjectTableModuleContextType } from '../context'
import { Filter } from '@ynput/ayon-react-components'
import { ExpandedState, OnChangeFn, SortingState } from '@tanstack/react-table'
import { ContextMenuItemConstructors } from '../hooks'
import { ReactNode } from 'react'

export interface ProjectOverviewProviderProps {
  children: ReactNode
  modules: ProjectTableModuleContextType
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
  expandedIds: string[]
  toggleExpanded: (id: string) => void
  updateExpanded: OnChangeFn<ExpandedState>
  setExpanded: (expanded: ExpandedState) => void

  // Sorting
  sorting: SortingState
  updateSorting: OnChangeFn<SortingState>

  // context menu items
  contextMenuItems: ContextMenuItemConstructors
}
