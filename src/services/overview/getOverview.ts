import api from '@api'
import { FolderNode, GetEntitiesByIdsQuery, GetTasksByParentQuery } from '@api/graphql'
import { EditorTaskNode } from '@pages/ProjectOverviewPage/OverviewEditor/types'
import {
  DefinitionsFromApi,
  FetchBaseQueryError,
  OverrideResultType,
  TagTypesFromApi,
} from '@reduxjs/toolkit/query'
import { isEqual } from 'lodash'

const transformFilteredEntities = (response: GetEntitiesByIdsQuery): GetEntitiesByIdsResult => {
  let folders: { [key: string]: Partial<FolderNode> } = {}
  let tasks: { [key: string]: Partial<EditorTaskNode> } = {}

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

// parse attribs JSON string to object
const parseAttribs = (allAttrib: string) => {
  try {
    return JSON.parse(allAttrib)
  } catch (e) {
    return {}
  }
}

const transformFilteredEntitiesByParent = (response: GetTasksByParentQuery): EditorTaskNode[] => {
  if (!response.project) {
    return []
  }

  const tasks: EditorTaskNode[] = []
  for (const { node: taskNode } of response.project.tasks.edges) {
    tasks.push({
      ...taskNode,
      folderId: taskNode.folderId || 'root',
      attrib: parseAttribs(taskNode.allAttrib),
    })
  }

  return tasks
}

type GetEntitiesByIdsResult = {
  folders: { [key: string]: Partial<FolderNode> }
  tasks: { [key: string]: Partial<EditorTaskNode> }
}

type GetFilteredEntitiesResult = {
  folders: { [key: string]: Partial<FolderNode> }
  tasks: { [key: string]: Partial<EditorTaskNode> }
}

type Definitions = DefinitionsFromApi<typeof api>
type TagTypes = TagTypesFromApi<typeof api>
type UpdatedDefinitions = Omit<Definitions, 'GetFilteredEntities'> & {
  GetEntitiesByIds: OverrideResultType<Definitions['GetEntitiesByIds'], GetEntitiesByIdsResult>
  GetTasksByParent: OverrideResultType<Definitions['GetTasksByParent'], EditorTaskNode[]>
  GetFilteredEntities: OverrideResultType<
    Definitions['GetTasksByParent'],
    GetFilteredEntitiesResult
  >
}

const enhancedApi = api.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    GetEntitiesByIds: {
      transformResponse: transformFilteredEntities,
    },
    GetTasksByParent: {
      transformResponse: transformFilteredEntitiesByParent,
      providesTags: (result, _e, { parentIds }) => {
        const taskTags =
          result?.map((task) => ({ type: 'overviewTask' as const, id: task.id })) || []

        const parentTags = (Array.isArray(parentIds) ? parentIds : [parentIds]).map((id) => ({
          type: 'overviewTask' as const,
          id,
        }))

        return [...taskTags, ...parentTags]
      },
    },
    GetFilteredEntities: {
      // transformResponse: transformFilteredEntitiesByParent,
    },
  },
})

const injectedApi = enhancedApi.injectEndpoints({
  endpoints: (build) => ({
    // Each project has one cache for all the tasks of the expanded folders
    // Changing the expanded folders will trigger a refetch but not a new cache
    // Each expanded folder has it's own query that is looped over here
    // When new folders are expanded, the new tasks are fetched and we use the cache for the rest
    // This also solves the pagination issue of getting all tasks in one query, splitting it up in multiple queries to avoid pagination limits
    getOverviewTasksByFolders: build.query<
      EditorTaskNode[],
      { projectName: string; parentIds: string[] }
    >({
      async queryFn({ projectName, parentIds }, { dispatch }) {
        try {
          // for each parentId, fetch the tasks
          const results = await Promise.all(
            parentIds.map(async (parentId) =>
              dispatch(
                enhancedApi.endpoints.GetTasksByParent.initiate({
                  projectName,
                  parentIds: [parentId],
                }),
              ),
            ),
          )

          const tasks = results
            .filter((r) => !!r.data)
            .flatMap((result) => result.data) as EditorTaskNode[]

          return { data: tasks }
        } catch (e: any) {
          // handle errors appropriately
          console.error(e)
          const error = { status: 'FETCH_ERROR', error: e.message } as FetchBaseQueryError
          return { error }
        }
      },
      // keep one cache per project
      serializeQueryArgs: ({ queryArgs: { projectName } }) => ({
        projectName,
      }),
      // Refetch when the page arg changes
      forceRefetch({ currentArg, previousArg }) {
        return !isEqual(currentArg, previousArg)
      },
      providesTags: [{ type: 'overviewTask', id: 'LIST' }],
    }),
  }),
})

export default injectedApi

export const {
  useGetEntitiesByIdsQuery,
  useGetTasksByParentQuery,
  useGetFilteredEntitiesQuery,
  useGetOverviewTasksByFoldersQuery,
} = injectedApi
