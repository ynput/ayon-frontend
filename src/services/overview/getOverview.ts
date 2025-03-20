import api from '@api'
import { api as foldersApi, QueryTasksFoldersApiArg } from '@api/rest/folders'
import { GetTasksByParentQuery, GetTasksListQuery } from '@api/graphql'
import { EditorTaskNode } from '@containers/ProjectTreeTable/utils/types'
import {
  DefinitionsFromApi,
  FetchBaseQueryError,
  OverrideResultType,
  TagTypesFromApi,
} from '@reduxjs/toolkit/query'
import { isEqual } from 'lodash'

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

const getOverviewTaskTags = (
  result: EditorTaskNode[] | undefined,
  parentIds?: string | string[],
) => {
  const taskTags = result?.map((task) => ({ type: 'overviewTask' as const, id: task.id })) || []

  if (!parentIds) return taskTags

  const parentTags = (Array.isArray(parentIds) ? parentIds : [parentIds]).map((id) => ({
    type: 'overviewTask' as const,
    id,
  }))

  return [...taskTags, ...parentTags]
}

type GetTasksListResult = {
  pageInfo: GetTasksListQuery['project']['tasks']['pageInfo']
  tasks: EditorTaskNode[]
}

type Definitions = DefinitionsFromApi<typeof api>
type TagTypes = TagTypesFromApi<typeof api>
type UpdatedDefinitions = Omit<Definitions, 'GetFilteredEntities'> & {
  GetTasksByParent: OverrideResultType<Definitions['GetTasksByParent'], EditorTaskNode[]>
  GetTasksList: OverrideResultType<Definitions['GetTasksList'], GetTasksListResult>
}

// GRAPHQL API
const enhancedApi = api.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    // This gets tasks for all parent folders provided
    // But in this case it will only ever receive one parent folder from the getOverviewTasksByFolders query
    // It is only used by getOverviewTasksByFolders in this file
    GetTasksByParent: {
      transformResponse: transformFilteredEntitiesByParent,
      providesTags: (result, _e, { parentIds }) => getOverviewTaskTags(result, parentIds),
    },
    GetTasksList: {
      transformResponse: (result: GetTasksListQuery) => ({
        tasks: transformFilteredEntitiesByParent(result),
        pageInfo: result.project.tasks.pageInfo,
      }),
      providesTags: (result) => getOverviewTaskTags(result?.tasks || []),
      serializeQueryArgs: ({ queryArgs: { after, before, last, first, ...rest } }) => ({ ...rest }),
      // Refetch when the page arg changes
      forceRefetch({ currentArg, previousArg }) {
        return !isEqual(currentArg, previousArg)
      },
      merge: (currentCache: GetTasksListResult, newCache: GetTasksListResult) => {
        const { tasks = [], pageInfo } = newCache
        const { tasks: lastTasks = [] } = currentCache

        const existingTaskIds = new Set(lastTasks.map((task) => task.id))
        const newTasks = [...lastTasks]

        for (const task of tasks) {
          if (!existingTaskIds.has(task.id)) {
            newTasks.push(task)
          }
        }

        return {
          tasks: newTasks,
          pageInfo,
        }
      },
    },
  },
})

// REST FOLDERS API
const foldersApiEnhanced = foldersApi.enhanceEndpoints({
  endpoints: {
    queryTasksFolders: {},
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
      { projectName: string; parentIds: string[]; filter?: string; search?: string }
    >({
      async queryFn({ projectName, parentIds, filter, search }, { dispatch, forced }) {
        try {
          // for each parentId, fetch the tasks
          const results = await Promise.all(
            parentIds.map(async (parentId) =>
              dispatch(
                enhancedApi.endpoints.GetTasksByParent.initiate(
                  {
                    projectName,
                    parentIds: [parentId],
                    filter,
                    search,
                  },
                  { forceRefetch: forced },
                ),
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
      serializeQueryArgs: ({ queryArgs: { parentIds, ...rest } }) => ({
        ...rest,
      }),
      // Refetch when the page arg changes
      forceRefetch({ currentArg, previousArg }) {
        return !isEqual(currentArg, previousArg)
      },
      providesTags: [{ type: 'overviewTask', id: 'LIST' }],
    }),
    // queryTasksFolders is a post so it's a bit annoying to consume
    // we wrap it in a queryFn to make it easier to consume as a query hook
    getQueryTasksFolders: build.query<string[], QueryTasksFoldersApiArg>({
      async queryFn({ projectName, tasksFoldersQuery }, { dispatch }) {
        try {
          const result = await dispatch(
            foldersApiEnhanced.endpoints.queryTasksFolders.initiate({
              projectName,
              tasksFoldersQuery,
            }),
          )

          const data = result.data?.folderIds || []

          return { data }
        } catch (e: any) {
          console.error(e)
          const error = { status: 'FETCH_ERROR', error: e.message } as FetchBaseQueryError
          return { error }
        }
      },
    }),
  }),
})

export default injectedApi

export const {
  useGetOverviewTasksByFoldersQuery,
  useGetQueryTasksFoldersQuery,
  useGetTasksListQuery,
} = injectedApi
