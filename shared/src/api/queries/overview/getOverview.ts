import {
  gqlApi,
  GetTasksByParentQuery,
  GetTasksListQuery,
  tasksApi,
  QueryTasksFoldersApiArg,
  GetTasksListQueryVariables,
} from '@shared/api/generated'
import { PubSub } from '@shared/util'
import { EditorTaskNode, TableGroupBy } from '@shared/containers/ProjectTreeTable'
import {
  DefinitionsFromApi,
  FetchBaseQueryError,
  OverrideResultType,
  TagTypesFromApi,
} from '@reduxjs/toolkit/query'

// parse attribs JSON string to object
export const parseAllAttribs = (allAttrib: string) => {
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
      attrib: parseAllAttribs(taskNode.allAttrib),
      entityId: taskNode.id,
      entityType: 'task',
      links: [],
    })
  }

  return tasks
}

const getOverviewTaskTags = (
  result: EditorTaskNode[] | undefined = [],
  projectName: string,
  parentIds?: string | string[],
) => {
  const taskTags = result?.map((task) => ({ type: 'overviewTask', id: task.id })) || []

  const parentTags = parentIds
    ? (Array.isArray(parentIds) ? parentIds : [parentIds]).map((id) => ({
        type: 'overviewTask',
        id,
      }))
    : []

  return [
    ...taskTags,
    ...parentTags,
    { type: 'overviewTask', id: projectName },
    { type: 'overviewTask', id: 'LIST' },
  ]
}

export type GetTasksListResult = {
  pageInfo: GetTasksListQuery['project']['tasks']['pageInfo']
  tasks: EditorTaskNode[]
}

export type GetTasksListArgs = {
  projectName: string
  filter?: string
  search?: string
  folderIds?: string[]
  desc?: boolean
  sortBy?: string
}

export type GetGroupedTasksListResult = {
  tasks: EditorTaskNode[]
}

export type GetGroupedTasksListArgs = {
  projectName: string
  groups: { filter: string; count: number; value: string }[]
  search?: string
  folderIds?: string[]
  desc?: boolean
  sortBy?: string
}

// Define the page param type for infinite query
type TasksListPageParam = {
  cursor: string
  desc?: boolean
}

type Definitions = DefinitionsFromApi<typeof gqlApi>
type TagTypes = TagTypesFromApi<typeof gqlApi>
type UpdatedDefinitions = Omit<Definitions, 'GetFilteredEntities'> & {
  GetTasksByParent: OverrideResultType<Definitions['GetTasksByParent'], EditorTaskNode[]>
  GetTasksList: OverrideResultType<Definitions['GetTasksList'], GetTasksListResult>
}

// GRAPHQL API
const enhancedApi = gqlApi.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
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
const foldersApiEnhanced = tasksApi.enhanceEndpoints({
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
      async onCacheEntryAdded(
        { projectName, parentIds, filter, search },
        { cacheDataLoaded, cacheEntryRemoved, updateCachedData, dispatch },
      ) {
        let token: any
        const pendingTaskIds = new Set<string>()
        const MAX_BATCH = 100
        const INTERVAL = 500
        let scheduled = false

        const schedule = () => {
          if (scheduled) return
          scheduled = true
          setTimeout(flush, INTERVAL)
        }

        const flush = async () => {
          scheduled = false
          if (!pendingTaskIds.size) return
          const batchIds = Array.from(pendingTaskIds).slice(0, MAX_BATCH)
          batchIds.forEach((id) => pendingTaskIds.delete(id))
          try {
            const res = await dispatch(
              enhancedApi.endpoints.GetTasksList.initiate(
                {
                  projectName,
                  taskIds: batchIds,
                } as any,
                { forceRefetch: true },
              ),
            ).unwrap()
            const returned = res.tasks || []
            const returnedMap = new Map(returned.map((t: EditorTaskNode) => [t.id, t]))

            updateCachedData((draft: EditorTaskNode[]) => {
              // update or add
              for (const task of returned) {
                const idx = draft.findIndex((t) => t.id === task.id)
                if (idx > -1) draft[idx] = task
                else draft.push(task)
              }
              // remove missing
              for (const id of batchIds) {
                if (!returnedMap.has(id)) {
                  const idx = draft.findIndex((t) => t.id === id)
                  if (idx > -1) draft.splice(idx, 1)
                }
              }
            })
          } catch (err) {
            console.error('Realtime overview batch update failed', err)
          } finally {
            if (pendingTaskIds.size) schedule()
          }
        }
        try {
          await cacheDataLoaded

          const handlePubSub = async (_topic: string, message: any) => {
            const taskId = message?.summary?.entityId
            const parentId = message?.summary?.parentId
            if (!taskId || !parentId) return
            // Only react if the parent folder is part of the current expanded set
            if (!parentIds.includes(parentId)) return
            pendingTaskIds.add(taskId)
            schedule()
          }

          // Subscribe to task entity updates
          // NOTE: backend emits topics like 'entity.task.assignees_changed'.
          // Assuming PubSub supports prefix matching when subscribing without the suffix.
          token = PubSub.subscribe('entity.task', handlePubSub)
        } catch (e) {
          // cache entry removed before loaded - ignore
        }

        await cacheEntryRemoved
        if (token) PubSub.unsubscribe(token)
      },
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
      GetTasksListArgs,
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
      async onCacheEntryAdded(
        arg,
        { cacheDataLoaded, cacheEntryRemoved, updateCachedData, dispatch },
      ) {
        let token: any
        const pendingTaskIds = new Set<string>()
        const MAX_BATCH = 100
        const INTERVAL = 500
        let scheduled = false

        const schedule = () => {
          if (scheduled) return
          scheduled = true
          setTimeout(flush, INTERVAL)
        }

        const flush = async () => {
          scheduled = false
          if (!pendingTaskIds.size) return
          const batchIds = Array.from(pendingTaskIds).slice(0, MAX_BATCH)
          batchIds.forEach((id) => pendingTaskIds.delete(id))
          try {
            const res = await dispatch(
              enhancedApi.endpoints.GetTasksList.initiate(
                {
                  projectName: arg.projectName,
                  taskIds: batchIds,
                  folderIds: arg.folderIds,
                } as any,
                { forceRefetch: true },
              ),
            ).unwrap()

            const returned = res.tasks || []
            const returnedMap = new Map(returned.map((t: EditorTaskNode) => [t.id, t]))

            updateCachedData((draft: { pages: GetTasksListResult[]; pageParams: any[] }) => {
              // update/insert
              for (const task of returned) {
                let located = false
                for (const page of draft.pages) {
                  const idx = page.tasks.findIndex((t) => t.id === task.id)
                  if (idx !== -1) {
                    page.tasks[idx] = task
                    located = true
                    break
                  }
                }
                if (!located) {
                  if (draft.pages.length) draft.pages[0].tasks.unshift(task)
                  else
                    draft.pages.push({
                      tasks: [task],
                      pageInfo: {
                        startCursor: null,
                        endCursor: null,
                        hasNextPage: false,
                        hasPreviousPage: false,
                      },
                    })
                }
              }
              // remove any requested but missing tasks
              for (const id of batchIds) {
                if (returnedMap.has(id)) continue
                for (const page of draft.pages) {
                  const idx = page.tasks.findIndex((t) => t.id === id)
                  if (idx !== -1) {
                    page.tasks.splice(idx, 1)
                    break
                  }
                }
              }
            })
          } catch (err) {
            console.error('Realtime infinite tasks batch update failed', err)
          } finally {
            if (pendingTaskIds.size) schedule()
          }
        }
        try {
          await cacheDataLoaded

          const handlePubSub = async (_topic: string, message: any) => {
            const taskId = message?.summary?.entityId
            if (!taskId) return
            pendingTaskIds.add(taskId)
            schedule()
          }

          token = PubSub.subscribe('entity.task', handlePubSub)
        } catch (_) {
          // ignore
        }
        await cacheEntryRemoved
        if (token) PubSub.unsubscribe(token)
      },
    }),
    getGroupedTasksList: build.query<GetGroupedTasksListResult, GetGroupedTasksListArgs>({
      queryFn: async ({ projectName, groups, search, folderIds, desc, sortBy }, api) => {
        try {
          let promises = []
          for (const group of groups) {
            const count = group.count || 500

            const queryParams: GetTasksListQueryVariables = {
              projectName,
              filter: group.filter,
              search,
              folderIds,
              sortBy: sortBy,
              // @ts-expect-error - we know group does not exist on query variables but we need it for later
              group: group.value,
            }
            if (desc) {
              queryParams.last = count
            } else {
              queryParams.first = count
            }

            const promise = api.dispatch(
              enhancedApi.endpoints.GetTasksList.initiate(queryParams, { forceRefetch: true }),
            )
            promises.push(promise)
          }

          const result = await Promise.all(promises)
          const tasks: EditorTaskNode[] = []
          for (const res of result) {
            if (res.error) throw res.error
            // get group value
            // @ts-expect-error - we know group does exist on res.originalArgs from line 319
            const groupValue = res.originalArgs?.group as string

            const hasNextPage =
              res.data?.pageInfo?.hasNextPage || res.data?.pageInfo?.hasPreviousPage || false
            const groupTasks =
              res.data?.tasks.map((task, i, a) => ({
                ...task,
                groups: [
                  {
                    value: groupValue,
                    hasNextPage: i === a.length - 1 && hasNextPage ? groupValue : undefined, // Only add hasNextPage to the last task in the group
                  },
                ],
              })) || []

            tasks.push(...groupTasks)
          }

          // Return the tasks directly as required by the query format
          return {
            data: {
              tasks,
            },
          }
        } catch (error: any) {
          console.error('Error in getGroupedTasksList queryFn:', error)
          return { error: { status: 'FETCH_ERROR', error: error.message } as FetchBaseQueryError }
        }
      },
      providesTags: (result, _e, { projectName }) =>
        getOverviewTaskTags(result?.tasks, projectName),
    }),
  }),
})

export const {
  useGetOverviewTasksByFoldersQuery,
  useGetQueryTasksFoldersQuery,
  useGetTasksListQuery,
  useGetTasksListInfiniteInfiniteQuery,
  useLazyGetTasksByParentQuery,
  useGetGroupedTasksListQuery,
} = injectedApi
export default injectedApi
