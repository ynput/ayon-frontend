import { FolderNode, GetFilteredEntitiesByParentQuery } from '@api/graphql'
import { $Any } from '@types'

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
  attrib?: Record<string, $Any>
  childOnlyMatch?: boolean // when true, only children of this folder match the filter and not the folder itself (shots a dot)
  subType?: string | null
  type: string
}

export type ExtraData = {
  type: string
  id: string
  name?: string | null
  label?: string | null
}

export type MatchingFolder = FolderNode & { childOnlyMatch?: boolean }
export type FolderNodeMap = Map<string, MatchingFolder>
export type EditorTaskNode =
  GetFilteredEntitiesByParentQuery['project']['tasks']['edges'][0]['node']
export type TaskNodeMap = Map<string, EditorTaskNode>
