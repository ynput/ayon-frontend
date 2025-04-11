import { GetTasksByParentQuery } from '@api/graphql'
import { FolderListItem } from '@api/rest/folders'

export type TableRow = {
  id: string
  parentId?: string
  name: string
  label: string
  icon: string | null
  color: string | null
  img: string | null
  startContent?: JSX.Element
  subRows: TableRow[]
  status?: string
  assignees?: string[]
  tags: string[]
  attrib?: Record<string, any>
  childOnlyMatch?: boolean // when true, only children of this folder match the filter and not the folder itself (shots a dot)
  subType?: string | null
  entityType: string
  ownAttrib: string[]
  path: string | null | undefined
  isLoading?: boolean
}

export type MatchingFolder = FolderListItem & { childOnlyMatch?: boolean; entityType?: 'folder' }
export type FolderNodeMap = Map<string, MatchingFolder>
type TaskNode = GetTasksByParentQuery['project']['tasks']['edges'][0]['node']
export type EditorTaskNode = TaskNode & {
  attrib: Record<string, any>
  entityType?: 'task'
}
export type TaskNodeMap = Map<string, EditorTaskNode>
