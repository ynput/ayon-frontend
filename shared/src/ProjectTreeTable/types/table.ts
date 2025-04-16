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
  attrib?: object
  ownAttrib?: string[]
  updatedAt: string
}

export type GetTasksByParentQuery = {
  __typename?: 'Query'
  project: {
    __typename?: 'ProjectNode'
    name: string
    tasks: {
      __typename?: 'TasksConnection'
      edges: Array<{
        __typename?: 'TaskEdge'
        node: {
          __typename?: 'TaskNode'
          id: string
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
          folder: { __typename?: 'FolderNode'; path?: string | null }
        }
      }>
    }
  }
}

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
export type TasksByFolderMap = Map<string, string[]>
