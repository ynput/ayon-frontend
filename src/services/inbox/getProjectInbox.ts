import { gqlApi } from '@shared/api'
import type { GetProjectInboxQuery, GetProjectInboxQueryVariables } from '@shared/api'
import { PubSub } from '@shared/util'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { TransformedInboxMessages, transformInboxMessages } from './inboxTransform'

const PROJECT_INBOX_PAGE_SIZE = 100
// a realtime message only ever lands at the top, so the top-up does not need a full page
const PROJECT_INBOX_REALTIME_SIZE = 20
// publishing a batch emits one inbox.message per version, so wait out the burst
const PROJECT_INBOX_REALTIME_DEBOUNCE = 1000

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

const EMPTY_PAGE: TransformedInboxMessages = {
  messages: [],
  projectNames: [],
  pageInfo: { hasPreviousPage: false, startCursor: null, endCursor: null },
}

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
    : EMPTY_PAGE

// the generated endpoint is only used through the infinite query, so its own cache entry
// is released as soon as the page has been read
const fetchPage = async (
  dispatch: any,
  args: ProjectInboxInfiniteArgs,
  page: { last: number; cursor?: string | null },
) => {
  const request = dispatch(
    gqlApi.endpoints.GetProjectInbox.initiate(pageVariables(args, page), { forceRefetch: true }),
  )
  try {
    return await request
  } finally {
    request.unsubscribe?.()
  }
}

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

          // passed through as-is: it carries the resolver's `detail`, which the placeholder
          // shows. Rewrapping it loses that, and a hand-built filter is easy to get wrong.
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
        let pendingTopUp: ReturnType<typeof setTimeout> | undefined
        // cursor of an unfinished walk back through a burst, null when there is none
        let chaseCursor: string | null = null
        // a websocket arrival still waiting for a pass over the newest page
        let freshPending = false
        try {
          // wait for the initial query to resolve before proceeding
          await cacheDataLoaded

          const topUp = async (cursor: string) => {
            const result = await fetchPage(dispatch, queryArg, {
              last: PROJECT_INBOX_REALTIME_SIZE,
              cursor,
            })
            if (result.error) return

            const { messages, pageInfo } = transformPage(result.data, queryArg.important)
            if (!messages.length) return

            let added = 0
            updateCachedData((draft) => {
              if (!draft?.pages?.length) return

              const cachedIds = new Set<string>()
              draft.pages.forEach((page) =>
                page.messages.forEach((m) => cachedIds.add(m.referenceId)),
              )

              const newMessages = messages.filter((m) => !cachedIds.has(m.referenceId))
              added = newMessages.length
              if (added) draft.pages[0].messages.unshift(...newMessages)
            })

            // nothing in the page was already held, so the burst outran it - walk back
            // until the rows we do hold come into view, otherwise the gap stays forever
            if (added === PROJECT_INBOX_REALTIME_SIZE && pageInfo.hasPreviousPage) {
              chaseCursor = pageInfo.endCursor || ''
              scheduleTopUp()
            } else if (freshPending) {
              scheduleTopUp()
            }
          }

          const scheduleTopUp = () => {
            if (pendingTopUp) return

            pendingTopUp = setTimeout(() => {
              pendingTopUp = undefined
              // an unfinished walk goes first: letting a new arrival take the slot would
              // re-read the newest page, find it cached and stop, stranding the rows between
              let cursor: string
              if (chaseCursor !== null) {
                cursor = chaseCursor
                chaseCursor = null
              } else if (freshPending) {
                cursor = ''
                freshPending = false
              } else return

              void topUp(cursor)
            }, PROJECT_INBOX_REALTIME_DEBOUNCE)
          }

          const handlePubSub = (topic: string, message: any) => {
            if (topic !== 'inbox.message') return
            if (message?.project !== queryArg.projectName) return
            // a new message is always active, so the cleared tab can never gain one
            if (!queryArg.active) return

            const isImportant = !!message?.summary?.isImportant
            if (queryArg.important !== null && queryArg.important !== isImportant) return

            freshPending = true
            scheduleTopUp()
          }

          // sub to websocket topic
          token = PubSub.subscribe('inbox.message', handlePubSub)
        } catch {
          // no-op in case `cacheEntryRemoved` resolves before `cacheDataLoaded`,
          // in which case `cacheDataLoaded` will throw
        }
        // cacheEntryRemoved will resolve when the cache subscription is no longer active
        await cacheEntryRemoved
        if (pendingTopUp) clearTimeout(pendingTopUp)
        PubSub.unsubscribe(token)
      },
    }),
  }),
})

export const { useGetProjectInboxInfiniteInfiniteQuery } = projectInboxApi
