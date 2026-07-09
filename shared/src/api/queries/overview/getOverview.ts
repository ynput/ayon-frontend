import {
  gqlApi,
  GetTasksByParentQuery,
  GetTasksListQuery,
  GetFolderColumnStatsQuery,
  GetTaskColumnStatsQuery,
  foldersApi,
  SearchFoldersApiArg,
  GetTasksListQueryVariables,
} from '@shared/api/generated'
import PubSub from '@shared/util/pubsub'
import { subscribeToThumbnailUpdates, ThumbnailUpdateMessage } from '@shared/util'
import { EditorTaskNode } from '@shared/containers/ProjectTreeTable'
import type { FieldStats } from '../columnStats'
import {
  normalizeFieldStats,
  mergeFieldStats,
  hasNewTargetFields,
  transformStatsError,
} from '../columnStats'
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
  folderFilter?: string
  search?: string
  folderIds?: string[]
  taskIds?: string[]
  desc?: boolean
  sortBy?: string
  showComments?: boolean
  includeFolderChildren?: boolean
}

export type GetGroupedTasksListResult = {
  tasks: EditorTaskNode[]
}

export type GetGroupedTasksListArgs = {
  projectName: string
  groups: { filter: string; count: number; value: string }[]
  search?: string
  folderFilter?: string
  folderIds?: string[]
  desc?: boolean
  sortBy?: string
  groupCount?: number // optional override for all groups
  showComments?: boolean
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
  GetFolderColumnStats: OverrideResultType<Definitions['GetFolderColumnStats'], FieldStats[]>
  GetTaskColumnStats: OverrideResultType<Definitions['GetTaskColumnStats'], FieldStats[]>
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
    // footer stats: `targets` excluded from cache key + responses merged,
    // so column toggles reuse cache and only added targets refetch
    GetFolderColumnStats: {
      transformResponse: (res: GetFolderColumnStatsQuery) =>
        normalizeFieldStats(res?.project?.folders?.fieldStats ?? []),
      transformErrorResponse: (error: any) => transformStatsError(error, 'folder'),
      serializeQueryArgs: ({ queryArgs: { targets: _t, ...rest } }) => rest,
      merge: (cache, incoming) => mergeFieldStats(incoming, cache),
      forceRefetch: ({ currentArg, previousArg }) => hasNewTargetFields(currentArg, previousArg),
      providesTags: (_r, _e, { projectName }) => [{ type: 'folderColumnStats', id: projectName }],
    },
    GetTaskColumnStats: {
      transformResponse: (res: GetTaskColumnStatsQuery) =>
        normalizeFieldStats(res?.project?.tasks?.fieldStats ?? []),
      transformErrorResponse: (error: any) => transformStatsError(error, 'task'),
      serializeQueryArgs: ({ queryArgs: { targets: _t, ...rest } }) => rest,
      merge: (cache, incoming) => mergeFieldStats(incoming, cache),
      forceRefetch: ({ currentArg, previousArg }) => hasNewTargetFields(currentArg, previousArg),
      providesTags: (_r, _e, { projectName }) => [{ type: 'taskColumnStats', id: projectName }],
    },
  },
})

// REST FOLDERS API
const foldersApiEnhanced = foldersApi.enhanceEndpoints({
  endpoints: {
    searchFolders: {},
  },
})

export const TASKS_INFINITE_QUERY_COUNT = 100 // Number of items to fetch per page

// --- TRACKING REGISTRY FOR EMPTY FOLDERS (FILTER-AWARE) ---
const queriedFoldersRegistry: Record<string, Set<string>> = {}

const getCacheKey = (
  projectName: string,
  filter?: string,
  folderFilter?: string,
  search?: string,
  showComments?: boolean,
) => {
  return JSON.stringify({ projectName, filter, folderFilter, search, showComments })
}

const markFoldersAsQueried = (cacheKey: string, folderIds: string[]) => {
  if (!queriedFoldersRegistry[cacheKey]) {
    queriedFoldersRegistry[cacheKey] = new Set()
  }
  folderIds.forEach((id) => queriedFoldersRegistry[cacheKey].add(id))
}

const getQueriedFolders = (cacheKey: string): Set<string> => {
  return queriedFoldersRegistry[cacheKey] || new Set()
}

const injectedApi = enhancedApi.injectEndpoints({
  endpoints: (build) => ({
    // Each project has one cache for all the tasks of the expanded folders
    // Changing the expanded folders will trigger a refetch but not a new cache
    // Each expanded folder has it's own query that is looped over here
    // When new folders are expanded, the new tasks are fetched and we use the cache for the rest
    // This also solves the pagination issue of getting all tasks in one query, splitting it up in multiple queries to avoid pagination limits
    getOverviewTasksByFolders: build.query<
      EditorTaskNode[],
      {
        projectName: string
        parentIds: string[]
        filter?: string
        folderFilter?: string
        search?: string
        showComments?: boolean
      }
    >({
      async queryFn({ projectName, parentIds, filter, folderFilter, search, showComments }, api) {
        try {
          const state = api.getState()
          const cacheArgs = { projectName, filter, folderFilter, search, showComments }

          // Select current flat cache state
          const currentCache = (injectedApi.endpoints as any).getOverviewTasksByFolders.select(
            cacheArgs,
          )(state)
          const cacheData: EditorTaskNode[] = currentCache?.data || []

          // 1. Generate a stable cache key matching RTK Query's serialization
          const cacheKey = getCacheKey(projectName, filter, folderFilter, search, showComments)

          // 2. Fetch our registry specific to THIS combination of search/filters
          const alreadyQueriedFolders = getQueriedFolders(cacheKey)

          // 3. Diffing: Only request folders that haven't hit the network under these specific filters
          const newFolderIds = parentIds.filter((id) => !alreadyQueriedFolders.has(id))

          // Short-circuit if all expanded folders have been evaluated for this filter setup
          if (newFolderIds.length === 0) {
            return { data: cacheData }
          }

          // 4. Mark them as queried for this cache key immediately to prevent duplicate flight requests
          markFoldersAsQueried(cacheKey, newFolderIds)

          // 5. Fire one single network request for all new folders using GetTasksByParent
          const result = await api.dispatch(
            enhancedApi.endpoints.GetTasksByParent.initiate(
              {
                projectName,
                parentIds: newFolderIds,
                filter,
                search,
                showComments: !!showComments,
                first: 100,
              },
              { forceRefetch: true },
            ),
          )

          if (result.error) throw result.error

          const newlyFetchedTasks = result.data || []

          // 5. Append new tasks to the existing flat array cache
          return {
            data: [...cacheData, ...newlyFetchedTasks],
          }
        } catch (e: any) {
          console.error(e)
          return { error: { status: 'FETCH_ERROR', error: e.message } as FetchBaseQueryError }
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
        { projectName, parentIds, filter, search, showComments },
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
                  showComments: !!showComments,
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
        let unsubscribeThumbnails: (() => void) | undefined
        try {
          await cacheDataLoaded

          unsubscribeThumbnails = subscribeToThumbnailUpdates(
            (messages: ThumbnailUpdateMessage[]) => {
              updateCachedData((draft: EditorTaskNode[]) => {
                messages.forEach((message) => {
                  if (message.summary.entityType === 'task' && message.summary.thumbnailHash) {
                    const idx = draft.findIndex((t) => t.id === message.summary.entityId)
                    if (idx > -1) {
                      draft[idx].thumbnailHash = message.summary.thumbnailHash
                    }
                  }
                })
              })
            },
            ['task'],
          )

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
        if (unsubscribeThumbnails) unsubscribeThumbnails()
      },
    }),
    // searchFolders is a post so it's a bit annoying to consume
    // we wrap it in a queryFn to make it easier to consume as a query hook
    getSearchFolders: build.query<string[], SearchFoldersApiArg>({
      async queryFn({ projectName, folderSearchRequest }, { dispatch }) {
        try {
          const result = await dispatch(
            foldersApiEnhanced.endpoints.searchFolders.initiate({
              projectName,
              folderSearchRequest,
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
      providesTags: (_r, _e, { projectName }) => [{ type: 'tasksFolder', id: projectName }],
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
          const {
            projectName,
            filter,
            folderFilter,
            search,
            folderIds,
            taskIds,
            sortBy,
            desc,
            showComments,
            includeFolderChildren,
          } = queryArg
          const { cursor } = pageParam

          // Build the query parameters for GetTasksList
          const queryParams: any = {
            projectName,
            filter,
            folderFilter,
            search,
            folderIds,
            taskIds,
            showComments: !!showComments,
            includeFolderChildren: includeFolderChildren !== false, // default to true
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
                  showComments: !!arg.showComments,
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
        let unsubscribeThumbnails: (() => void) | undefined
        try {
          await cacheDataLoaded

          unsubscribeThumbnails = subscribeToThumbnailUpdates(
            (messages: ThumbnailUpdateMessage[]) => {
              updateCachedData((draft: { pages: GetTasksListResult[]; pageParams: any[] }) => {
                messages.forEach((message) => {
                  if (message.summary.entityType === 'task' && message.summary.thumbnailHash) {
                    for (const page of draft.pages) {
                      const idx = page.tasks.findIndex((t) => t.id === message.summary.entityId)
                      if (idx > -1) {
                        page.tasks[idx].thumbnailHash = message.summary.thumbnailHash
                        break
                      }
                    }
                  }
                })
              })
            },
            ['task'],
          )

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
        if (unsubscribeThumbnails) unsubscribeThumbnails()
      },
    }),
    getGroupedTasksList: build.query<GetGroupedTasksListResult, GetGroupedTasksListArgs>({
      queryFn: async (
        {
          projectName,
          groups,
          search,
          folderFilter,
          folderIds,
          desc,
          sortBy,
          groupCount,
          showComments,
        },
        api,
      ) => {
        try {
          let promises = []
          // Folder-level filter keys that must go in folderFilter, not task filter
          const folderFilterKeys = new Set(['folderType'])

          for (const group of groups) {
            // Determine count for this group - use argument override, else group count, else default
            const count = groupCount || group.count || 500

            // Separate folder-level conditions from task-level conditions in the group filter
            let taskFilter: string | undefined = group.filter
            let mergedFolderFilter = folderFilter
            if (group.filter) {
              try {
                const parsed = JSON.parse(group.filter)
                const conditions = parsed.conditions || []
                const taskConditions = conditions.filter((c: any) => !folderFilterKeys.has(c.key))
                const folderConditions = conditions.filter((c: any) => folderFilterKeys.has(c.key))

                if (folderConditions.length > 0) {
                  taskFilter = taskConditions.length
                    ? JSON.stringify({ ...parsed, conditions: taskConditions })
                    : undefined
                  // Merge folder conditions with existing folderFilter, preserving metadata
                  const existingFolderFilter = folderFilter ? JSON.parse(folderFilter) : null
                  const existingConditions =
                    existingFolderFilter && Array.isArray(existingFolderFilter.conditions)
                      ? existingFolderFilter.conditions
                      : []
                  const allFolderConditions = [...existingConditions, ...folderConditions]
                  mergedFolderFilter = JSON.stringify(
                    existingFolderFilter
                      ? { ...existingFolderFilter, conditions: allFolderConditions }
                      : { conditions: allFolderConditions },
                  )
                }
              } catch {
                // If parsing fails, use the original filter as-is
              }
            }

            const queryParams: GetTasksListQueryVariables = {
              projectName,
              filter: taskFilter,
              folderFilter: mergedFolderFilter,
              search,
              folderIds,
              sortBy: sortBy,
              showComments: !!showComments,
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
    getMoreTasksForSingleFolder: build.query<
      EditorTaskNode[],
      {
        projectName: string
        folderId: string
        filter?: string
        search?: string
        showComments?: boolean
        parentQueryArgs: {
          projectName: string
          filter?: string
          folderFilter?: string
          search?: string
          showComments?: boolean
        }
      }
    >({
      queryFn: async ({ projectName, folderId, filter, search, showComments }, api) => {
        try {
          const result = await api.dispatch(
            enhancedApi.endpoints.GetTasksByParent.initiate(
              {
                projectName,
                parentIds: [folderId],
                filter,
                search,
                showComments: !!showComments,
                first: TASKS_INFINITE_QUERY_COUNT,
              } as any,
              { forceRefetch: true },
            ),
          )

          if (result.error) throw result.error

          const tasks = (result.data as EditorTaskNode[]) || []
          return { data: tasks }
        } catch (e: any) {
          return { error: { status: 'FETCH_ERROR', error: e.message } as FetchBaseQueryError }
        }
      },
      async onQueryStarted({ parentQueryArgs }, { dispatch, queryFulfilled }) {
        try {
          const { data: newTasks } = await queryFulfilled

          // Seamlessly patch the flat array cache slot with duplicate protection
          dispatch(
            injectedApi.util.updateQueryData(
              'getOverviewTasksByFolders' as any,
              parentQueryArgs as any,
              // @ts-expect-error - we know the draft is EditorTaskNode[] from the query above
              (draft: EditorTaskNode[]) => {
                console.log('Patching tasks into main cache')
                // Create a quick lookup Set of IDs already resident in the cache
                const existingIds = new Set(draft.map((task) => task.id))

                // Only push tasks that don't already exist in the cache
                for (const task of newTasks) {
                  if (!existingIds.has(task.id)) {
                    draft.push(task)
                  } else {
                    // Optional: If the task exists, update it in place to keep attributes fresh
                    const idx = draft.findIndex((t) => t.id === task.id)
                    if (idx > -1) {
                      draft[idx] = task
                    }
                  }
                }
              },
            ),
          )
        } catch (err) {
          console.error('Failed to patch overview tasks flat cache:', err)
        }
      },
    }),
  }),
})

export const {
  useGetOverviewTasksByFoldersQuery,
  useGetSearchFoldersQuery,
  useGetTasksListQuery,
  useGetTasksListInfiniteInfiniteQuery,
  useLazyGetTasksByParentQuery,
  useGetGroupedTasksListQuery,
  useGetFolderColumnStatsQuery,
  useGetTaskColumnStatsQuery,
  useLazyGetMoreTasksForSingleFolderQuery,
} = injectedApi
export default injectedApi
