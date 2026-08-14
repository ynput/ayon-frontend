import { gqlApi } from '@shared/api'
import type { GetProjectInboxQuery, GetProjectInboxQueryVariables } from '@shared/api'
import { createRealtimeBatcher, PubSub } from '@shared/util'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import {
  EMPTY_INBOX_PAGE,
  TransformedInboxMessages,
  transformInboxMessages,
  unshiftNewMessages,
} from './inboxTransform'

const PROJECT_INBOX_PAGE_SIZE = 100

export interface ProjectInboxInfiniteArgs {
  projectName: string
  userName: string
  referenceTypes: string[]
  activityTypes: string[] | null
  filter: string
  // not sent to the server - they build the filter and key the cache
  active: boolean
  important: boolean | null
}

const pageVariables = (
  { projectName, userName, referenceTypes, activityTypes, filter }: ProjectInboxInfiniteArgs,
  { last, cursor }: { last: number; cursor?: string | null },
): GetProjectInboxQueryVariables => ({
  projectName,
  userName,
  referenceTypes,
  activityTypes,
  filter,
  last,
  cursor,
})

const transformPage = (
  res: GetProjectInboxQuery | undefined,
  important: boolean | null,
): TransformedInboxMessages =>
  res
    ? transformInboxMessages(
        res.project.activities,
        { important: important ?? false },
        { truncate: true },
      )
    : EMPTY_INBOX_PAGE

// unsubscribed: the page is read here, the infinite query owns the cache
const fetchPage = (
  dispatch: any,
  args: ProjectInboxInfiniteArgs,
  page: { last: number; cursor?: string | null },
) =>
  dispatch(
    gqlApi.endpoints.GetProjectInbox.initiate(pageVariables(args, page), {
      forceRefetch: true,
      subscribe: false,
    }),
  )

export const projectInboxApi = gqlApi.injectEndpoints({
  endpoints: (build) => ({
    getProjectInboxInfinite: build.infiniteQuery<
      TransformedInboxMessages,
      ProjectInboxInfiniteArgs,
      { cursor: string }
    >({
      infiniteQueryOptions: {
        initialPageParam: { cursor: '' },
        getNextPageParam: (lastPage) => {
          const { hasPreviousPage, endCursor } = lastPage.pageInfo
          if (!hasPreviousPage || !endCursor) return undefined
          return { cursor: endCursor }
        },
      },
      queryFn: async ({ queryArg, pageParam }, api) => {
        try {
          const result = await fetchPage(api.dispatch, queryArg, {
            last: PROJECT_INBOX_PAGE_SIZE,
            cursor: pageParam?.cursor,
          })

          // passed through as-is: rewrapping loses the resolver's `detail`
          if (result.error) return { error: result.error as FetchBaseQueryError }

          return { data: transformPage(result.data, queryArg.important) }
        } catch (e: any) {
          console.error('Error in getProjectInboxInfinite queryFn:', e)
          return {
            error: { status: 'FETCH_ERROR', error: String(e?.message ?? e) } as FetchBaseQueryError,
          }
        }
      },
      keepUnusedDataFor: 30,
      providesTags: (_res, _error, { projectName, active }) => [
        { type: 'inbox', id: 'LIST' },
        { type: 'inbox', id: `project=${projectName}` },
        { type: 'inbox', id: `project=${projectName}/active=${active}` },
      ],
      async onCacheEntryAdded(
        queryArg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch },
      ) {
        let token

        // one request per burst, sized to it: new rows always sort to the top and the query
        // carries the filters. `inbox.message` names no activity, so ids cannot be asked for.
        const batcher = createRealtimeBatcher<{ id: string }>(
          async (burst) => {
            const result = await fetchPage(dispatch, queryArg, { last: burst.length })
            if (result.error) return

            const { messages } = transformPage(result.data, queryArg.important)
            if (!messages.length) return

            updateCachedData((draft) => unshiftNewMessages(draft, messages))
          },
          (message) => message.id,
        )

        try {
          // wait for the initial query to resolve before proceeding
          await cacheDataLoaded

          const handlePubSub = (topic: string, message: any) => {
            if (topic !== 'inbox.message') return
            if (message?.project !== queryArg.projectName) return
            // a new message is always active, so the cleared tab can never gain one
            if (!queryArg.active) return

            const isImportant = !!message?.summary?.isImportant
            if (queryArg.important !== null && queryArg.important !== isImportant) return

            batcher.add(message)
          }

          // sub to websocket topic
          token = PubSub.subscribe('inbox.message', handlePubSub)
        } catch {
          // no-op in case `cacheEntryRemoved` resolves before `cacheDataLoaded`,
          // in which case `cacheDataLoaded` will throw
        }
        // cacheEntryRemoved will resolve when the cache subscription is no longer active
        await cacheEntryRemoved
        batcher.clear()
        PubSub.unsubscribe(token)
      },
    }),
  }),
})

export const { useGetProjectInboxInfiniteInfiniteQuery } = projectInboxApi
