import api from '@shared/api'

// newest events of each kind
const HISTORY_LIMIT = 500

/** A `bundle.created` or `bundle.updated` event, the flags are the bundle's state after it */
export type BundleEvent = {
  id: string
  topic: string
  /** epoch ms */
  createdAt: number
  user: string | null
  name: string
  /** what an update set, e.g. `isProduction`, `addons`. Empty for a created bundle */
  changedFields: string[]
  isProduction: boolean
  isStaging: boolean
  isDev: boolean
}

export type BundleHistoryKind = 'production' | 'staging' | 'addons' | 'created'

export type BundleHistory = {
  /** ascending, each event once */
  events: BundleEvent[]
  /** the limit was reached, older events of that kind are missing */
  truncated: Record<BundleHistoryKind, boolean>
}

/** Addon versions of a bundle after an event, an addon that is not in the bundle has none */
export type BundleAddons = Record<string, string | null>

type RawEvent = {
  id: string
  topic: string
  user?: string | null
  summary?: string | Record<string, any> | null
  createdAt: string
}

type Edges = { edges: { node: RawEvent }[] }

// The events query cannot filter by summary or by bundle name (the text filter is lowercased):
// prefilter by the words of the descriptions ("Bundle 'X' has been set as production.",
// "... updated with new addons.") and match exactly on the summary.
const FIELDS = `edges { node { id topic user summary createdAt } }`
const HISTORY_QUERY = `
query BundleHistory {
  production: events(topics: ["bundle.updated"], filter: "production", last: ${HISTORY_LIMIT}) { ${FIELDS} }
  staging: events(topics: ["bundle.updated"], filter: "staging", last: ${HISTORY_LIMIT}) { ${FIELDS} }
  addons: events(topics: ["bundle.updated"], filter: "addons", last: ${HISTORY_LIMIT}) { ${FIELDS} }
  created: events(topics: ["bundle.created"], last: ${HISTORY_LIMIT}) { ${FIELDS} }
}
`

const PAYLOAD_QUERY = `
query BundleEventPayload($ids: [String!]!) {
  events(ids: $ids) { edges { node { id payload } } }
}
`

const parseJson = (value: unknown) => {
  if (typeof value !== 'string') return value ?? {}
  try {
    return JSON.parse(value) ?? {}
  } catch {
    return {}
  }
}

const toEvent = (raw: RawEvent): BundleEvent => {
  const summary = parseJson(raw.summary) as Record<string, any>
  return {
    id: raw.id,
    topic: raw.topic,
    createdAt: new Date(raw.createdAt).getTime(),
    user: raw.user ?? null,
    name: summary.name,
    changedFields: summary.changedFields ?? [],
    isProduction: !!summary.isProduction,
    isStaging: !!summary.isStaging,
    isDev: !!summary.isDev,
  }
}

const KINDS: BundleHistoryKind[] = ['production', 'staging', 'addons', 'created']

export const bundleHistoryApi = api.injectEndpoints({
  endpoints: (build) => ({
    getBundleHistory: build.query<BundleHistory, void>({
      query: () => ({ document: HISTORY_QUERY }),
      transformResponse: (res: Record<BundleHistoryKind, Edges>) => {
        const events = new Map<string, BundleEvent>()
        for (const kind of KINDS) {
          for (const { node } of res[kind].edges) events.set(node.id, toEvent(node))
        }
        return {
          events: [...events.values()].sort((a, b) => a.createdAt - b.createdAt),
          truncated: Object.fromEntries(
            KINDS.map((kind) => [kind, res[kind].edges.length >= HISTORY_LIMIT]),
          ) as Record<BundleHistoryKind, boolean>,
        }
      },
      // refetched when bundles change, here or through the websocket
      providesTags: [{ type: 'bundleList' }],
    }),
    /** Addons after each event by id, null when the event is gone (retention) or not visible */
    getBundleEventsAddons: build.query<Record<string, BundleAddons | null>, { ids: string[] }>({
      query: ({ ids }) => ({ document: PAYLOAD_QUERY, variables: { ids } }),
      transformResponse: (
        res: { events: { edges: { node: { id: string; payload: unknown } }[] } },
        _meta,
        { ids },
      ) => {
        const found = new Map(
          res.events.edges.map(({ node }) => [
            node.id,
            ((parseJson(node.payload) as { addons?: BundleAddons }).addons ?? {}) as BundleAddons,
          ]),
        )
        return Object.fromEntries(ids.map((id) => [id, found.get(id) ?? null]))
      },
      // payloads never change
      keepUnusedDataFor: 600,
    }),
  }),
  overrideExisting: true,
})

export const { useGetBundleHistoryQuery } = bundleHistoryApi
