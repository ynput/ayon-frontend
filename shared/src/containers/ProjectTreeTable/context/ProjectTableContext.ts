import { createContext, useContext } from 'react'
import { EntityMap, TableRow } from '../types/table'
import {
  FindInheritedValueFromAncestors,
  GetAncestorsOf,
  GetInheritedDependents,
  FindNonInheritedValues,
} from '../hooks/useFolderRelationships'
import { RowId } from '../utils/cellUtils'

import { ProjectTableProviderProps } from './ProjectTableProvider'

export type ToggleExpandAll = (rowIds: RowId[], expand?: boolean) => void
export type ToggleExpands = (rowIds: RowId[], expand?: boolean) => void

export interface ProjectTableContextType {
  isInitialized: ProjectTableProviderProps['isInitialized']
  isLoading: ProjectTableProviderProps['isLoading']
  // Project Info
  projectInfo: ProjectTableProviderProps['projectInfo']
  projectName: ProjectTableProviderProps['projectName']
  users: ProjectTableProviderProps['users']
  // Attributes
  attribFields: ProjectTableProviderProps['attribFields']
  error?: string
  scopes: ProjectTableProviderProps['scopes']

  // Data
  tableData: TableRow[]
  tasksMap: ProjectTableProviderProps['tasksMap']
  foldersMap: ProjectTableProviderProps['foldersMap']
  entitiesMap: ProjectTableProviderProps['entitiesMap']
  fetchNextPage: ProjectTableProviderProps['fetchNextPage']
  reloadTableData: ProjectTableProviderProps['reloadTableData']
  getEntityById: (id: string, field?: string) => EntityMap | undefined // if the entity is not found, we explicity search for the field

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
  setExpanded: ProjectTableProviderProps['setExpanded']
  toggleExpanded: ProjectTableProviderProps['toggleExpanded']
  updateExpanded: ProjectTableProviderProps['updateExpanded']
  toggleExpandAll: ToggleExpandAll
  toggleExpands: ToggleExpands // expand/collapse multiple rows at once

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

  // player
  playerOpen?: ProjectTableProviderProps['playerOpen']
  onOpenPlayer?: ProjectTableProviderProps['onOpenPlayer']

  // views
  onResetView?: () => void
}

export const ProjectTableContext = createContext<ProjectTableContextType | undefined>(undefined)

export const useProjectTableContext = () => {
  const context = useContext(ProjectTableContext)
  if (!context) {
    throw new Error('useProjectTableContext must be used within a ProjectTableProvider')
  }
  return context
}
