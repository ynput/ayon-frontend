import { FolderNode, TaskNode } from "@api/graphql"

export type TableRow = {
  id: string
  parentId?: string
  name: string
  label: string
  icon?: string | null
  iconColor?: string
  img?: string | null
  startContent?: JSX.Element
  subRows: TableRow[]
  data: ExtraData
}

export type ExtraData = {
  id: string
  type: string
  name?: string | null
  label?: string | null
  subType?: string | null
}

export type MatchingFolder = Partial<FolderNode> & { matchesFilters: boolean }
export type FolderNodeMap = { [key: string]: MatchingFolder }
export type TaskNodeMap = { [key: string]: TaskNode }