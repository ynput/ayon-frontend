import { GetTasksByParentQuery } from '@shared/api'
import type { EntityLink } from '@shared/api'
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
  hasReviewables?: boolean
  hasVersions?: boolean
  links: EntityLink[]
}

export type TableRow = {
  id: string
  entityId?: string
  entityType: string
  name: string
  label: string
  path?: string | null | undefined
  ownAttrib?: string[]
  tags?: string[]
  status?: string
  updatedAt?: string
  createdAt?: string
  parentId?: string
  folderId?: string | null // all entities have a folder except root folders which will be null
  parents?: string[]
  folder?: string // parent folder name
  product?: string // product name of product and version parent
  subRows?: TableRow[]
  icon?: string | null
  color?: string | null
  img?: string | null
  hasReviewables?: boolean
  hasVersions?: boolean
  version?: number | null // for versions
  versionsCount?: number // for products
  startContent?: JSX.Element
  assignees?: string[]
  author?: string
  attrib?: Record<string, any>
  links?: Record<string, LinkValue> // links to other entities, e.g. tasks, versions, products
  childOnlyMatch?: boolean // when true, only children of this folder match the filter and not the folder itself (shots a dot)
  subType?: string | null
  isLoading?: boolean
  metaType?: 'empty' | 'error' // signals the row is a meta row (empty or error state)
  group?: GroupData // signals it is a group row and has some extra data like label, color, icon
  thumbnail?: {
    // if you want to use a thumbnail from a different entity, e.g. latest version of a product
    entityId: string
    entityType: string
    updatedAt: string | undefined
  }
}

export type MatchingFolder = FolderListItem & {
  childOnlyMatch?: boolean
  entityId: string
  entityType: 'folder'
}
export type FolderNodeMap = Map<string, MatchingFolder>
type TaskNode = GetTasksByParentQuery['project']['tasks']['edges'][0]['node']
export type EditorTaskNode = Omit<TaskNode, 'links'> & {
  attrib: Record<string, any>
  entityId: string
  entityType: 'task'
  groups?: { value: string; hasNextPage?: string }[]
  links: EntityLink[]
  hasVersions?: boolean
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
  links: EntityLink[]
  hasVersions?: boolean
}

type EditorProductNode = {
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
