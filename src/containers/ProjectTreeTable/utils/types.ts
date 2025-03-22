import { FolderNode, GetTasksByParentQuery } from '@api/graphql'

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
  data: ExtraData
  status?: string
  assignees?: string[]
  tags: string[]
  attrib?: Record<string, any>
  childOnlyMatch?: boolean // when true, only children of this folder match the filter and not the folder itself (shots a dot)
  subType?: string | null
  type: string
  ownAttrib: string[]
  path: string | null | undefined
}

export type ExtraData = {
  type: string
  id: string
  name?: string | null
  label?: string | null
}

export type MatchingFolder = FolderNode & { childOnlyMatch?: boolean }
export type FolderNodeMap = Map<string, MatchingFolder>
export type EditorTaskNode = GetTasksByParentQuery['project']['tasks']['edges'][0]['node'] & {
  attrib: Record<string, any>
}
export type TaskNodeMap = Map<string, EditorTaskNode>
