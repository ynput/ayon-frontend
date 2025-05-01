import { api, GetTasksByParentQuery, GetTasksListQuery } from '@shared/client'
import { QueryTasksFoldersApiArg, api as foldersApi } from '../../folders'
import { EditorTaskNode } from '@shared/containers/ProjectTreeTable'
import {
  DefinitionsFromApi,
  FetchBaseQueryError,
  OverrideResultType,
  TagTypesFromApi,
} from '@reduxjs/toolkit/query'

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
  projectName: string,
  parentIds?: string | string[],
) => {
  const taskTags = result?.map((task) => ({ type: 'overviewTask', id: task.id })) || []

  if (!parentIds) return taskTags

  const parentTags = (Array.isArray(parentIds) ? parentIds : [parentIds]).map((id) => ({
    type: 'overviewTask',
    id,
  }))

  return [
    ...taskTags,
    ...parentTags,
    { type: 'overviewTask', id: projectName },
    { type: 'overviewTask', id: 'LIST' },
  ]
}

type GetTasksListResult = {
  pageInfo: GetTasksListQuery['project']['tasks']['pageInfo']
  tasks: EditorTaskNode[]
}

// Define the page param type for infinite query
type TasksListPageParam = {
  cursor: string
  desc?: boolean
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
      providesTags: (result, _e, { parentIds, projectName }) =>
        getOverviewTaskTags(result, projectName, parentIds),
    },
    GetTasksList: {
      transformResponse: (result: GetTasksListQuery) => ({
        tasks: transformFilteredEntitiesByParent(result),
        pageInfo: result.project.tasks.pageInfo,
      }),
      providesTags: (result, _e, { projectName }) =>
        getOverviewTaskTags(result?.tasks || [], projectName),
    },
  },
})

// REST FOLDERS API
const foldersApiEnhanced = foldersApi.enhanceEndpoints({
  endpoints: {
    queryTasksFolders: {},
  },
})

export const TASKS_INFINITE_QUERY_COUNT = 100 // Number of items to fetch per page

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
          // Process parent IDs in sequential batches
          const BATCH_SIZE = 20 // Process x parentIds at a time
          const allTasks: EditorTaskNode[] = []

          // Process batches one after another
          for (let i = 0; i < parentIds.length; i += BATCH_SIZE) {
            const batchParentIds = parentIds.slice(i, i + BATCH_SIZE)

            // Process this batch in parallel
            const batchResults = await Promise.all(
              batchParentIds.map(async (parentId) =>
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

            // Add the results from this batch to our accumulated results
            const batchTasks = batchResults
              .filter((r) => !!r.data)
              .flatMap((result) => result.data as EditorTaskNode[])

            allTasks.push(...batchTasks)
          }

          return { data: allTasks }
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
        return JSON.stringify(currentArg) !== JSON.stringify(previousArg)
      },
      providesTags: (result, _e, { parentIds, projectName }) =>
        getOverviewTaskTags(result, projectName, parentIds),
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
    // Add new infinite query endpoint for tasks list
    getTasksListInfinite: build.infiniteQuery<
      GetTasksListResult,
      {
        projectName: string
        filter?: string
        search?: string
        folderIds?: string[]
        desc?: boolean
        sortBy?: string
      },
      TasksListPageParam
    >({
      infiniteQueryOptions: {
        initialPageParam: { cursor: '', desc: false },
        // Calculate the next page param based on current page response and params
        getNextPageParam: (lastPage, _allPages, lastPageParam, _allPageParams) => {
          // Use the endCursor from the query as the next page param
          const pageInfo = lastPage.pageInfo
          const desc = lastPageParam.desc
          const hasNextPage = desc ? pageInfo.hasPreviousPage : pageInfo.hasNextPage

          if (!hasNextPage || !pageInfo.endCursor) return undefined

          return {
            cursor: pageInfo.endCursor,
            desc: lastPageParam.desc,
          }
        },
      },
      queryFn: async ({ queryArg, pageParam }, api) => {
        try {
          const { projectName, filter, search, folderIds, sortBy, desc } = queryArg
          const { cursor } = pageParam

          // Build the query parameters for GetTasksList
          const queryParams: any = {
            projectName,
            filter,
            search,
            folderIds,
          }

          // Add cursor-based pagination
          if (sortBy) {
            queryParams.sortBy = sortBy
            if (desc) {
              queryParams.before = cursor || undefined
              queryParams.last = TASKS_INFINITE_QUERY_COUNT
            } else {
              queryParams.after = cursor || undefined
              queryParams.first = TASKS_INFINITE_QUERY_COUNT
            }
          } else {
            queryParams.after = cursor || undefined
            queryParams.first = TASKS_INFINITE_QUERY_COUNT
          }

          // Call the existing GetTasksList endpoint
          const result = await api.dispatch(
            enhancedApi.endpoints.GetTasksList.initiate(queryParams, { forceRefetch: true }),
          )

          if (result.error) throw result.error
          const fallback = {
            tasks: [],
            pageInfo: {
              hasNextPage: false,
              endCursor: null,
              startCursor: null,
              hasPreviousPage: false,
            },
          }

          // Return the tasks directly as required by the infinite query format
          return {
            data: result.data || fallback,
          }
        } catch (e: any) {
          console.error('Error in getTasksListInfinite queryFn:', e)
          return { error: { status: 'FETCH_ERROR', error: e.message } as FetchBaseQueryError }
        }
      },
      providesTags: (result, _e, { projectName }) =>
        getOverviewTaskTags(result?.pages.flatMap((p) => p.tasks) || [], projectName),
    }),
  }),
})

export { injectedApi as getOverviewApi }

export const {
  useGetOverviewTasksByFoldersQuery,
  useGetQueryTasksFoldersQuery,
  useGetTasksListQuery,
  useGetTasksListInfiniteInfiniteQuery, // Fix the export name
  useLazyGetTasksByParentQuery,
} = injectedApi
