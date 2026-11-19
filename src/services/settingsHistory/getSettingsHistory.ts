import api from '@shared/api'
import { PubSub } from '@shared/util'

// newest changes per addon, across all its variants and scopes
const HISTORY_LIMIT = 500

/** One `settings.changed` event: a save of the overrides of one addon version */
export type SettingsChange = {
  id: string
  /** epoch ms */
  createdAt: number
  user: string | null
  addonName: string
  addonVersion: string
  variant: string
  projectName: string | null
}

/** Overrides before and after a change, as stored in the event payload */
export type SettingsChangePayload = {
  originalValue: Record<string, unknown>
  newValue: Record<string, unknown>
}

export type SettingsHistory = {
  /** ascending */
  changes: SettingsChange[]
  /** the limit was reached, older changes are missing */
  truncated: boolean
}

export type SettingsHistoryArgs = {
  addonName: string
  variant: string
  /** project overrides of this project, studio overrides when null */
  projectName: string | null
}

type RawChange = {
  id: string
  user?: string | null
  project?: string | null
  summary?: string | Record<string, any> | null
  createdAt: string | number
}

// The events query cannot filter by summary: prefilter by the words of the description
// ("<addon> <version> <variant> ... overrides changed") and match exactly here.
const HISTORY_QUERY = `
query SettingsHistory($filter: String!, $projects: [String!]) {
  events(topics: ["settings.changed"], filter: $filter, projects: $projects, last: ${HISTORY_LIMIT}) {
    edges { node { id user project summary createdAt } }
  }
}
`

const PAYLOAD_QUERY = `
query SettingsChangePayload($ids: [String!]!) {
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

// websocket messages send epoch seconds, graphql sends ISO strings
const toMs = (value: string | number) =>
  typeof value === 'number' ? (value < 1e12 ? value * 1000 : value) : new Date(value).getTime()

const toChange = (raw: RawChange): SettingsChange => {
  const summary = parseJson(raw.summary) as Record<string, any>
  return {
    id: raw.id,
    createdAt: toMs(raw.createdAt),
    user: raw.user ?? null,
    addonName: summary.addon_name,
    addonVersion: summary.addon_version,
    variant: summary.variant,
    projectName: raw.project ?? null,
  }
}

const matches = (change: SettingsChange, args: SettingsHistoryArgs) =>
  change.addonName === args.addonName &&
  change.variant === args.variant &&
  change.projectName === args.projectName

// the text filter lowercases and strips its words, only these variants are safe to add
const getTextFilter = ({ addonName, variant }: SettingsHistoryArgs) =>
  ['production', 'staging'].includes(variant) ? `${addonName} ${variant}` : addonName

export const settingsHistoryApi = api.injectEndpoints({
  endpoints: (build) => ({
    getSettingsHistory: build.query<SettingsHistory, SettingsHistoryArgs>({
      query: (args) => ({
        document: HISTORY_QUERY,
        variables: {
          filter: getTextFilter(args),
          projects: args.projectName ? [args.projectName] : null,
        },
      }),
      transformResponse: (res: { events: { edges: { node: RawChange }[] } }, _meta, args) => ({
        changes: res.events.edges
          .map(({ node }) => toChange(node))
          .filter((change) => matches(change, args))
          .sort((a, b) => a.createdAt - b.createdAt),
        truncated: res.events.edges.length >= HISTORY_LIMIT,
      }),
      async onCacheEntryAdded(args, { updateCachedData, cacheDataLoaded, cacheEntryRemoved }) {
        let token: string | undefined
        try {
          await cacheDataLoaded
          token = PubSub.subscribe('settings.changed', (_topic: string, message: RawChange) => {
            if (!message?.id) return
            const change = toChange(message)
            if (!matches(change, args)) return
            updateCachedData((draft) => {
              if (!draft.changes.some((c) => c.id === change.id)) draft.changes.push(change)
            })
          })
        } catch {
          // cacheEntryRemoved resolved before cacheDataLoaded
        }
        await cacheEntryRemoved
        if (token) PubSub.unsubscribe(token)
      },
    }),
    /** null when the event is gone (retention) or not visible to the user */
    getSettingsChangePayload: build.query<SettingsChangePayload | null, { id: string }>({
      query: ({ id }) => ({ document: PAYLOAD_QUERY, variables: { ids: [id] } }),
      transformResponse: (res: { events: { edges: { node: { payload: unknown } }[] } }) => {
        const node = res.events.edges[0]?.node
        if (!node) return null
        const payload = parseJson(node.payload) as Partial<SettingsChangePayload>
        return { originalValue: payload.originalValue ?? {}, newValue: payload.newValue ?? {} }
      },
      // payloads never change
      keepUnusedDataFor: 600,
    }),
  }),
  overrideExisting: true,
})

export const { useGetSettingsChangePayloadQuery } = settingsHistoryApi
