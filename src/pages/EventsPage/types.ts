export type EventItem = {
  id: string
  topic: string
  user: string | null
  sender: string | null
  project: string | null
  description: string
  dependsOn: string | null
  status: string
  summary: Record<string, any>
  /** epoch ms */
  createdAt: number
  /** epoch ms */
  updatedAt: number
  /** graphql cursor, used to resolve surrounding events */
  cursor?: string
}

export type Severity = 'error' | 'warning' | 'info' | 'debug'

export type EventFilters = {
  search?: string
  /** topic categories, eg `entity` matches `entity.*` */
  types?: string[]
  /** explicit topics, `*` is a wildcard */
  topics?: string[]
  /** log levels, matches `log.<severity>` */
  severities?: Severity[]
  statuses?: string[]
  projects?: string[]
  users?: string[]
  /** entity id stored in the event summary */
  entity?: string
  /** date preset id, resolved when the events load so a saved view keeps meaning "last 24 hours" */
  datePreset?: string
  /** ISO timestamp, inclusive lower bound */
  newerThan?: string
  /** ISO timestamp, upper bound */
  olderThan?: string
  hideLogs?: boolean
}

export type EventsLayout = 'table' | 'timeline'

/** What a saved view of this page stores */
export type EventsViewSettings = {
  filters?: EventFilters
  layout?: EventsLayout
}
