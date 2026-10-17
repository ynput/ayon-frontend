import api from '@shared/api'
import { createRealtimeBatcher, PubSub } from '@shared/util'
import type { EventFilters, EventItem } from '@pages/EventsPage/types'
import {
  buildGqlVariables,
  buildQueryFilter,
  matchesFilters,
} from '@pages/EventsPage/utils/filters'

const EVENTS_PAGE_SIZE = 200

const EVENT_FIELDS = `
  id
  topic
  user
  sender
  project
  description
  dependsOn
  status
  summary
  createdAt
  updatedAt
`

const EVENTS_QUERY = `
query EventsPage(
  $last: Int, $before: String, $includeLogs: Boolean!, $topics: [String!], $projects: [String!],
  $users: [String!], $statuses: [String!], $newerThan: String, $olderThan: String, $filter: String
) {
  events(
    last: $last, before: $before, includeLogs: $includeLogs, topics: $topics, projects: $projects,
    users: $users, statuses: $statuses, newerThan: $newerThan, olderThan: $olderThan, filter: $filter
  ) {
    edges { cursor node { ${EVENT_FIELDS} } }
    pageInfo { hasPreviousPage endCursor }
  }
}
`

// an empty `ids` list is invalid on the server, so the parent is resolved with a second call
const EVENT_BY_ID_QUERY = `
query EventById($ids: [String!]!) {
  events(ids: $ids, includeLogs: true) { edges { cursor node { ${EVENT_FIELDS} } } }
}
`

const EVENT_NEIGHBOURS_QUERY = `
query EventNeighbours($cursor: String!, $count: Int!) {
  older: events(last: $count, before: $cursor, includeLogs: true) {
    edges { cursor node { ${EVENT_FIELDS} } }
  }
  newer: events(first: $count, after: $cursor, includeLogs: true) {
    edges { cursor node { ${EVENT_FIELDS} } }
  }
}
`

type RawEvent = {
  id: string
  topic: string
  user?: string | null
  sender?: string | null
  project?: string | null
  description?: string | null
  dependsOn?: string | null
  status: string
  summary?: string | Record<string, any> | null
  createdAt: string | number
  updatedAt: string | number
}

type RawConnection = {
  edges: { cursor?: string | null; node: RawEvent }[]
  pageInfo?: { hasPreviousPage: boolean; endCursor?: string | null }
}

const parseSummary = (summary: RawEvent['summary']): Record<string, any> => {
  if (!summary) return {}
  if (typeof summary !== 'string') return summary
  try {
    return JSON.parse(summary) || {}
  } catch {
    return {}
  }
}

// websocket messages send epoch seconds, graphql and rest send ISO strings
const toMs = (value: string | number): number =>
  typeof value === 'number' ? (value < 1e12 ? value * 1000 : value) : new Date(value).getTime()

const transformEvent = (node: RawEvent, cursor?: string | null): EventItem => ({
  id: node.id,
  topic: node.topic,
  user: node.user ?? null,
  sender: node.sender ?? null,
  project: node.project ?? null,
  description: node.description ?? '',
  dependsOn: node.dependsOn ?? null,
  status: node.status,
  summary: parseSummary(node.summary),
  createdAt: toMs(node.createdAt),
  updatedAt: toMs(node.updatedAt),
  cursor: cursor ?? undefined,
})

// the rest query endpoint returns snake_case keys
type RawRestEvent = RawEvent & {
  created_at: string
  updated_at: string
  depends_on?: string | null
}

const transformRestEvent = (e: RawRestEvent) =>
  transformEvent({
    ...e,
    createdAt: e.createdAt ?? e.created_at,
    updatedAt: e.updatedAt ?? e.updated_at,
    dependsOn: e.dependsOn ?? e.depends_on,
  })

const transformEdges = (connection?: RawConnection | null) =>
  connection?.edges.map(({ node, cursor }) => transformEvent(node, cursor)) ?? []

export type EventsPage = {
  events: EventItem[]
  hasMore: boolean
  cursor?: string
}

// graphql pages by cursor, the rest query (used for entity filters) pages by offset
export type EventsPageParam = { cursor?: string; offset?: number }

export type EventNeighbours = { older: EventItem[]; newer: EventItem[] }

const eventsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getEventsInfinite: build.infiniteQuery<EventsPage, EventFilters, EventsPageParam>({
      infiniteQueryOptions: {
        initialPageParam: {},
        getNextPageParam: (lastPage, allPages) => {
          if (!lastPage.hasMore) return undefined
          if (lastPage.cursor) return { cursor: lastPage.cursor }
          return { offset: allPages.reduce((acc, page) => acc + page.events.length, 0) }
        },
      },
      queryFn: async ({ queryArg, pageParam }, _api, _extra, baseQuery) => {
        // events of a single entity can only be resolved through the rest query endpoint
        if (queryArg.entity) {
          const result = await baseQuery({
            url: '/api/query',
            method: 'POST',
            body: {
              entity: 'event',
              filter: buildQueryFilter(queryArg),
              limit: EVENTS_PAGE_SIZE,
              offset: pageParam.offset ?? 0,
            },
          })
          if (result.error) return { error: result.error }
          const events = (result.data as RawRestEvent[]).map(transformRestEvent)
          return { data: { events, hasMore: events.length === EVENTS_PAGE_SIZE } }
        }

        const result = await baseQuery({
          document: EVENTS_QUERY,
          variables: {
            ...buildGqlVariables(queryArg),
            last: EVENTS_PAGE_SIZE,
            before: pageParam.cursor,
          },
        })
        if (result.error) return { error: result.error }
        const connection = (result.data as { events: RawConnection }).events
        const events = transformEdges(connection)
        return {
          data: {
            events,
            hasMore: !!connection.pageInfo?.hasPreviousPage,
            cursor: events[events.length - 1]?.cursor,
          },
        }
      },
      keepUnusedDataFor: 60,
      async onCacheEntryAdded(filters, { updateCachedData, cacheDataLoaded, cacheEntryRemoved }) {
        let token: string | undefined
        const batcher = createRealtimeBatcher(
          (messages: RawEvent[]) => {
            updateCachedData((draft) => {
              const first = draft.pages[0]
              if (!first) return
              // index every loaded event so updates (status changes) patch in place
              const index = new Map<string, [number, number]>()
              draft.pages.forEach((page, p) =>
                page.events.forEach((e, i) => index.set(e.id, [p, i])),
              )
              const added: EventItem[] = []
              for (const message of messages) {
                const event = transformEvent(message)
                const existing = index.get(event.id)
                if (existing) {
                  const [p, i] = existing
                  draft.pages[p].events[i] = { ...event, cursor: draft.pages[p].events[i].cursor }
                } else if (matchesFilters(event, filters)) {
                  added.push(event)
                }
              }
              if (added.length) {
                added.sort((a, b) => b.createdAt - a.createdAt)
                first.events.unshift(...added)
              }
            })
          },
          (message: RawEvent) => `${message.id}:${message.updatedAt}`,
          500,
        )

        try {
          await cacheDataLoaded
          // live events only make sense when the range includes "now"
          if (!filters.olderThan) {
            token = PubSub.subscribe('*', (topic: string, message: RawEvent) => {
              if (topic === 'client.connected' || !message?.id || !message?.topic) return
              batcher.add(message)
            })
          }
        } catch {
          // cacheEntryRemoved resolved before cacheDataLoaded
        }

        await cacheEntryRemoved
        if (token) PubSub.unsubscribe(token)
        batcher.clear()
      },
    }),
    // resolves the cursor (needed for surrounding events) of events not in the loaded list
    getEventGql: build.query<EventItem | null, { id: string }>({
      query: ({ id }) => ({ document: EVENT_BY_ID_QUERY, variables: { ids: [id] } }),
      transformResponse: (res: { events: RawConnection }) => transformEdges(res.events)[0] ?? null,
    }),
    getEventNeighbours: build.query<EventNeighbours, { cursor: string; count?: number }>({
      query: ({ cursor, count = 5 }) => ({
        document: EVENT_NEIGHBOURS_QUERY,
        variables: { cursor, count },
      }),
      transformResponse: (res: { older: RawConnection; newer: RawConnection }) => ({
        older: transformEdges(res.older),
        // `first` returns ascending order, show the closest one last like the timeline does
        newer: transformEdges(res.newer).sort((a, b) => b.createdAt - a.createdAt),
      }),
    }),
    // children are only searchable through the admin query endpoint
    getEventChildren: build.query<EventItem[], { id: string }>({
      query: ({ id }) => ({
        url: '/api/query',
        method: 'POST',
        body: {
          entity: 'event',
          filter: { conditions: [{ key: 'dependsOn', value: id, operator: 'eq' }] },
          limit: 50,
        },
      }),
      transformResponse: (res: RawRestEvent[]) => res.map(transformRestEvent),
    }),
    getEventById: build.query<any, { id: string }>({
      query: ({ id }) => ({ url: `/api/events/${id}` }),
      providesTags: (_res, _err, { id }) => [{ type: 'detail', id: `event-${id}` }],
    }),
    restartEvent: build.mutation<void, { id: string }>({
      query: ({ id }) => ({
        url: `/api/events/${id}`,
        method: 'PATCH',
        body: { status: 'restarted' },
      }),
      // the websocket message patches the loaded lists, only the detail needs refreshing
      invalidatesTags: (_res, _err, { id }) => [{ type: 'detail', id: `event-${id}` }],
    }),
  }),
  overrideExisting: true,
})

export const {
  useGetEventsInfiniteInfiniteQuery,
  useGetEventGqlQuery,
  useGetEventNeighboursQuery,
  useGetEventChildrenQuery,
  useGetEventByIdQuery,
  useRestartEventMutation,
} = eventsApi
