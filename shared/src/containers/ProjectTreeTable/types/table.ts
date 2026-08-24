import type { GetTasksByParentQuery } from '@shared/api'
import type { EntityComment, EntityLink, SubTaskNode } from '@shared/api'
import { GroupData } from '../hooks/useBuildGroupByTableData'
import { LinkValue } from '../utils'

export type FolderListItem = {
  id: string
  path: string
  parentId?: string
  parents: string[]
  name: string
  label?: string
  folderType: string
  hasTasks?: boolean
  hasChildren?: boolean
  taskNames?: string[]
  tags?: string[]
  status: string
  attrib?: Record<string, any>
  ownAttrib?: string[]
  updatedAt: string
  createdAt: string
  thumbnailHash?: string
  hasReviewables?: boolean
  hasVersions?: boolean
  links: EntityLink[]
}

export type EntityType = 'folder' | 'task' | 'product' | 'version'

export interface BaseEntityData {
  id: string
  name: string
  label?: string
  icon?: string | null
  color?: string | null
  path?: string | null
  img?: string | null
  hasReviewables?: boolean
  status?: string
  tags?: string[]
  createdAt?: string
  updatedAt?: string
  thumbnailHash?: string
  attrib?: Record<string, any>
  ownAttrib?: string[]
  links?: Record<string, LinkValue>
  latestComments?: EntityComment[]
}

export interface FolderEntityData extends BaseEntityData {
  entityType: 'folder'
  subType: string
  hasTasks?: boolean
  hasVersions?: boolean
}

export interface TaskEntityData extends BaseEntityData {
  entityType: 'task'
  subType: string
  assignees?: string[]
  subtasks?: SubTaskNode[]
}

export interface ProductEntityData extends BaseEntityData {
  entityType: 'product'
  subType: string
  productBaseType?: string
  versionsCount?: number
  versionName?: string
  author?: string
}

export interface VersionEntityData extends BaseEntityData {
  entityType: 'version'
  version: number
  versionName?: string
  author?: string
}

export type EntityData = FolderEntityData | TaskEntityData | ProductEntityData | VersionEntityData

export type EntityScope = 'primary' | EntityType

export type ParentColumnDataType = 'string' | 'datetime' | 'list_of_strings'
export type ParentColumnOptionKey =
  | 'status'
  | 'folderStatus'
  | 'folderType'
  | 'taskType'
  | 'taskStatus'
  | 'productType'
  | 'assignee'
  | 'tag'

export type ParentColumnDefinition = {
  scope: EntityType
  field: string
  label: string
  id?: string
  optionKey?: ParentColumnOptionKey
  dataType?: ParentColumnDataType
  readOnly?: boolean
  sortable?: boolean
  includeAttributes?: boolean
  updateField?: string
  fallbackToPrimary?: boolean
}

export const ENTITY_FIELD_SUPPORT: Record<string, readonly EntityType[]> = {
  status: ['folder', 'task', 'product', 'version'],
  subType: ['folder', 'task', 'product'],
  assignees: ['task'],
  author: ['version'],
  version: ['version'],
  productBaseType: ['product'],
  tags: ['folder', 'task', 'product', 'version'],
  createdAt: ['folder', 'task', 'product', 'version'],
  updatedAt: ['folder', 'task', 'product', 'version'],
  name: ['folder', 'task', 'product', 'version'],
  label: ['folder', 'task', 'version'],
  thumbnailHash: ['folder', 'task', 'version'],
}

export const isFieldSupported = (field: string, entityType: EntityType): boolean => {
  const supportedEntityTypes = ENTITY_FIELD_SUPPORT[field]
  return !supportedEntityTypes || supportedEntityTypes.includes(entityType)
}

export interface TableRow {
  id: string
  primary: EntityData
  parents?: Partial<Record<EntityType, EntityData>>
  midnightExclusiveFields?: string[]
  isLoading?: boolean
  metaType?: 'empty' | 'error'
  group?: GroupData
  subRows?: TableRow[]
  childOnlyMatch?: boolean
}

export const getScopedEntity = (row: TableRow, scope: EntityScope): EntityData | undefined =>
  scope === 'primary' ? row.primary : row.parents?.[scope]

export const getScopedValue = (
  row: TableRow,
  scope: EntityScope,
  field: string,
  isAttrib = false,
): any => {
  if (row.group) {
    if (isAttrib || scope !== 'primary' || field !== 'name') return undefined
    return row.primary.name
  }

  const entity = getScopedEntity(row, scope)
  if (!entity || (!isAttrib && !isFieldSupported(field, entity.entityType))) return undefined
  return isAttrib ? entity.attrib?.[field] : entity[field as keyof EntityData]
}

export type MatchingFolder = FolderListItem & {
  childOnlyMatch?: boolean
  entityId: string
  entityType: 'folder'
}
export type FolderNodeMap = Map<string, MatchingFolder>
type TaskNode = GetTasksByParentQuery['project']['tasks']['edges'][0]['node']
export type EditorTaskNode = Omit<TaskNode, 'links' | 'data'> & {
  attrib: Record<string, any>
  entityId: string
  entityType: 'task'
  groups?: { value: string; hasNextPage?: string }[]
  links: EntityLink[]
  hasVersions?: boolean
  data: Record<string, any>
}

export type EditorVersionNode = {
  id: string
  entityId: string
  entityType: 'version'
  folderId: string
  label?: string | null
  name: string
  ownAttrib: Array<string>
  status: string
  tags: Array<string>
  taskType: string
  updatedAt: any
  createdAt?: string
  active: boolean
  assignees: Array<string>
  allAttrib: string
  attrib?: Record<string, any>
  product?: {
    id: string
    folder?: {
      id: string
    }
  }
  productType: string
  links: EntityLink[]
  hasVersions?: boolean
}

export type EditorProductNode = {
  id: string
  entityId: string
  entityType: 'product'
  folderId: string
  label?: string | null
  name: string
  ownAttrib: Array<string>
  status: string
  tags: Array<string>
  taskType: string
  updatedAt: any
  createdAt?: string
  active: boolean
  assignees: Array<string>
  allAttrib: string
  attrib?: Record<string, any>
  links: EntityLink[]
  hasVersions?: boolean
}

export type TaskNodeMap = Map<string, EditorTaskNode>
export type EntityMap = EditorTaskNode | MatchingFolder | EditorVersionNode | EditorProductNode
export type EntitiesMap = Map<string, EntityMap>
export type EMapResult<T extends 'folder' | 'task' | 'product' | 'version'> = T extends 'folder'
  ? MatchingFolder
  : T extends 'task'
  ? EditorTaskNode
  : T extends 'product'
  ? EditorProductNode
  : EditorVersionNode
export type TasksByFolderMap = Map<string, string[]>
