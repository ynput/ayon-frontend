import { GetListItemsQuery, GetListsQuery } from '@shared/api/generated'

// Define the type for our transformed lists data
type QueryEntityList = GetListsQuery['project']['entityLists']['edges'][number]['node']
export type EntityList = QueryEntityList & { entityType: 'folder' | 'version' | 'task' | 'product' }

// Define the result type for lists query
export type GetListsResult = {
  pageInfo: {
    hasNextPage: boolean
    endCursor?: string | null
  }
  lists: EntityList[]
}

// Define the page param type for infinite query
export type ListsPageParam = {
  cursor: string
}

// Extra types from the query
type QueryEntityListItemEdge =
  GetListItemsQuery['project']['entityLists']['edges'][number]['node']['items']['edges'][number]

type ItemNodeData = {
  name: string
  status: string
  tags: string[]
  taskType?: string
  folderType?: string
  productType?: string
  assignees?: string[]
  label?: string
  ownAttrib: string[]
  // different paths to folder
  path?: string
  folder?: {
    path: string
    folderType: string
  }
  product?: {
    name: string
    productType: string
    folder: {
      path: string
      folderType: string
    }
  }
  task?: {
    name: string
    taskType: string
  }
}

export type QueryEntityListItemNode = QueryEntityListItemEdge['node'] & ItemNodeData

export type EntityListItem = NonNullable<QueryEntityListItemNode> &
  Omit<QueryEntityListItemEdge, 'node'> & { attrib: Record<string, unknown> }
// Define the result type for items query
export type GetListItemsResult = {
  pageInfo: {
    hasNextPage: boolean
    endCursor?: string | null
  }
  items: (QueryEntityListItemNode &
    Omit<QueryEntityListItemEdge, 'node'> & { attrib: Record<string, unknown> })[]
}

export type ListItemsPageParam = {
  cursor: string
}

// websocket message summary
export type ListItemMessage = {
  project: string
  summary: {
    count: number
    entity_list_type: string
    entity_type: string
    id?: string
    entityId?: string
    label: string
  }
}
