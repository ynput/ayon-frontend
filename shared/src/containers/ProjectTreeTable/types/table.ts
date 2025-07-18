import { GetTasksByParentQuery } from '@shared/api'
import { GroupData } from '../hooks/useBuildGroupByTableData'
import { LinkValue } from '../utils'
import { FolderLink } from '@shared/api/queries/overview/getFoldersLinks'
import { TaskLink } from '@shared/api/queries/overview/getEntityLinks'

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
  hasReviewables?: boolean
  links: FolderLink[]
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
  parentId?: string
  subRows: TableRow[]
  icon?: string | null
  color?: string | null
  img?: string | null
  hasReviewables?: boolean
  startContent?: JSX.Element
  assignees?: string[]
  attrib?: Record<string, any>
  links: Record<string, LinkValue> // links to other entities, e.g. tasks, versions, products
  childOnlyMatch?: boolean // when true, only children of this folder match the filter and not the folder itself (shots a dot)
  subType?: string | null
  isLoading?: boolean
  group?: GroupData // signals it is a group row and has some extra data like label, color, icon
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
  links: TaskLink[]
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
  active: boolean
  assignees: Array<string>
  allAttrib: string
  attrib?: Record<string, any>
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
