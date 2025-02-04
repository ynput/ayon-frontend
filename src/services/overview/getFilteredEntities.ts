import api from '@api'
import {
  FolderNode,
  GetEntitiesByIdsQuery,
  GetFilteredEntitiesByParentQuery,
  GetFilteredEntitiesQuery,
  GetFilteredEntitiesQueryVariables,
  TaskNode,
} from '@api/graphql'
import {
  DefinitionsFromApi,
  FetchBaseQueryError,
  OverrideResultType,
  TagTypesFromApi,
} from '@reduxjs/toolkit/query'
import { QueryReturnValue } from '@types'

const transformFilteredEntities = (response: GetEntitiesByIdsQuery): GetEntitiesByIdsResult => {
  let folders: { [key: string]: Partial<FolderNode> } = {}
  let tasks: { [key: string]: Partial<TaskNode> } = {}

  if (!response.project) {
    return { folders: {}, tasks: {} }
  }

  // Add folders
  for (const { node } of response.project.folders.edges) {
    folders[node.id] = {
      ...node,
      parentId: node.parentId || 'root',
    }
  }

  for (const { node: taskNode } of response.project.tasks.edges) {
    tasks[taskNode.id] = {
      ...taskNode,
      folderId: taskNode.folderId || 'root',
    }
  }

  return { folders, tasks }
}

const transformFilteredEntitiesByParent = (
  response: GetFilteredEntitiesByParentQuery,
): GetFilteredEntitiesByParentResult => {
  let folders: { [key: string]: Partial<FolderNode> } = {}
  let tasks: { [key: string]: Partial<TaskNode> } = {}

  if (!response.project) {
    return { folders: {}, tasks: {} }
  }

  /*
  // Add folders
  for (const { node } of response.project.folders.edges) {
    folders[node.id] = {
      ...node,
      parentId: node.parentId || 'root',
    }
  }
  */

  for (const { node: taskNode } of response.project.tasks.edges) {
    tasks[taskNode.id] = {
      ...taskNode,
      folderId: taskNode.folderId || 'root',
    }
  }

  return { folders, tasks }
}

type GetEntitiesByIdsResult = {
  folders: { [key: string]: Partial<FolderNode> }
  tasks: { [key: string]: Partial<TaskNode> }
}
type GetFilteredEntitiesByParentResult = {
  folders: { [key: string]: Partial<FolderNode> }
  tasks: { [key: string]: Partial<TaskNode> }
}
type GetFilteredEntitiesResult = {
  folders: { [key: string]: Partial<FolderNode> }
  tasks: { [key: string]: Partial<TaskNode> }
}

type Definitions = DefinitionsFromApi<typeof api>
type TagTypes = TagTypesFromApi<typeof api>
type UpdatedDefinitions = Omit<Definitions, 'GetFilteredEntities'> & {
  GetEntitiesByIds: OverrideResultType<Definitions['GetEntitiesByIds'], GetEntitiesByIdsResult>
  GetFilteredEntitiesByParent: OverrideResultType<
    Definitions['GetFilteredEntitiesByParent'],
    GetFilteredEntitiesByParentResult
  >
  GetFilteredEntities: OverrideResultType<
    Definitions['GetFilteredEntitiesByParent'],
    GetFilteredEntitiesResult
  >
}

const enhancedApi = api.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    GetEntitiesByIds: {
      transformResponse: transformFilteredEntities,
    },
    GetFilteredEntitiesByParent: {
      transformResponse: transformFilteredEntitiesByParent,
    },
    GetFilteredEntities: {
      // transformResponse: transformFilteredEntitiesByParent,
    },
  },
})

enhancedApi.injectEndpoints({
  endpoints: (build) => ({
    getPaginatedFilteredEntities: build.query<GetFilteredEntitiesQuery, GetFilteredEntitiesQueryVariables>({
      async queryFn(
        { projectName, first = 0 }: GetFilteredEntitiesQueryVariables,
        { dispatch },
      ): Promise<QueryReturnValue<GetFilteredEntitiesQuery, FetchBaseQueryError, {}>> {
        try {
          let cursor = '0'
          let pageInfo = {}
          let tasks: {node: TaskNode}[] = []
          do {

            const response = await dispatch(
              enhancedApi.endpoints.GetFilteredEntities.initiate({
                projectName,
                first,
                after: cursor,
              }),
            )

            if (response.error) {
              return { error: response.error }
            }

            pageInfo = response.data!.project!.tasks.pageInfo
            cursor = pageInfo.endCursor
            tasks = tasks.concat(response.data!.project!.tasks.edges)
          } while (pageInfo.hasNextPage)

          let mappedTasks: { [key: string]: Partial<TaskNode> } = {}
          for (const taskNode of tasks) {
            mappedTasks[taskNode.node.id] = {
              ...taskNode.node,
              folderId: taskNode.node.folderId || 'root',
            }
          }
          return { data: { folders: {}, tasks: mappedTasks } }
        } catch {}
        return { data: {} }
      },
    }),
  }),
})

export default enhancedApi

export const {
  useGetEntitiesByIdsQuery,
  useGetFilteredEntitiesByParentQuery,
  useGetFilteredEntitiesQuery,
  // @ts-ignore
  useGetPaginatedFilteredEntitiesQuery,
} = enhancedApi
