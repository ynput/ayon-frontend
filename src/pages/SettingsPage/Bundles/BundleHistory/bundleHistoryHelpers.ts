import type {
  BundleAddons,
  BundleEvent,
  BundleHistory,
} from '@queries/bundleHistory/getBundleHistory'
import type {
  TimelineChange,
  TimelineLane,
} from '@containers/AddonSettings/SettingsHistory/SettingsTimeline'
import { LANE_COLORS } from '@containers/AddonSettings/SettingsHistory/settingsHistoryHelpers'

export type BundleVariant = 'production' | 'staging'

/** What the history can show: which bundle was production or staging, or a dev bundle's addons */
export type BundleSource = { key: string; title: string; color: string; variant?: BundleVariant }

export type AddonChange = { name: string; before: string | null; after: string | null }

/**
 * A change on the bundles timeline. Production, staging: the bundle that held it before (`from`,
 * undefined when not known) and after (`to`), null when none. A dev bundle: the addon versions it
 * changed, null when not known.
 */
export type BundleChange = TimelineChange & {
  bundleName: string
  source: BundleSource
  created: boolean
  from?: string | null
  to?: string | null
  addons?: AddonChange[] | null
}

export type BundleLane = TimelineLane<BundleChange>

/** The bundles in the list, as far as the history needs them */
export type ListedBundle = {
  name: string
  isProduction?: boolean
  isStaging?: boolean
  isDev?: boolean
}

const FLAGS = { production: 'isProduction', staging: 'isStaging' } as const

const PRODUCTION = 'var(--color-hl-production)'
const STAGING = 'var(--color-hl-staging)'
// the first dev bundle in the badge colour, the others told apart
const DEV = ['var(--color-hl-developer)', ...LANE_COLORS.slice(0, 3)]
const OTHER = LANE_COLORS[LANE_COLORS.length - 1]

const PRODUCTION_SOURCE: BundleSource = {
  key: 'production',
  title: 'Production',
  color: PRODUCTION,
  variant: 'production',
}
const STAGING_SOURCE: BundleSource = {
  key: 'staging',
  title: 'Staging',
  color: STAGING,
  variant: 'staging',
}

/**
 * What the selected bundles are, in the colours of their badges: production, staging, dev
 * bundles. Production and staging when they are none of these.
 */
export const getSources = (selected: ListedBundle[]): BundleSource[] => {
  const sources = [
    ...(selected.some((bundle) => bundle.isProduction) ? [PRODUCTION_SOURCE] : []),
    ...(selected.some((bundle) => bundle.isStaging) ? [STAGING_SOURCE] : []),
    ...selected
      .filter((bundle) => bundle.isDev)
      .map((bundle, i) => ({
        key: `dev:${bundle.name}`,
        title: bundle.name,
        color: DEV[i % DEV.length],
      })),
  ]
  return sources.length ? sources : [PRODUCTION_SOURCE, STAGING_SOURCE]
}

const toChange = (event: BundleEvent, source: BundleSource): BundleChange => ({
  id: event.id,
  createdAt: event.createdAt,
  user: event.user,
  color: source.color,
  bundleName: event.name,
  source,
  created: event.topic === 'bundle.created',
})

/**
 * Which bundle held a variant over time. Setting a bundle as production does not unset the previous
 * one in the events, so the lane is the sequence of bundles set. Setting the bundle that holds it
 * again changes nothing, an unset only counts for the bundle that held it.
 */
export const getVariantChanges = (events: BundleEvent[], source: BundleSource) => {
  const flag = FLAGS[source.variant ?? 'production']
  const changes: BundleChange[] = []
  let holder: string | null | undefined
  for (const event of events) {
    const touched =
      event.topic === 'bundle.created' ? event[flag] : event.changedFields.includes(flag)
    if (!touched) continue
    const to = event[flag] ? event.name : null
    if (holder !== undefined && (to === holder || (!to && holder !== event.name))) continue
    changes.push({ ...toChange(event, source), from: holder, to })
    holder = to
  }
  return changes
}

/**
 * Creation of a bundle and the updates that may have changed its addons. A name can be used again,
 * so only the events since it was last created count. `truncated`: its creation was not loaded.
 */
export const getBundleEvents = (events: BundleEvent[], name: string) => {
  let bundleEvents: BundleEvent[] = []
  let truncated = true
  for (const event of events) {
    if (event.name !== name) continue
    if (event.topic === 'bundle.created') {
      bundleEvents = [event]
      truncated = false
    } else if (event.changedFields.includes('addons')) {
      bundleEvents.push(event)
    }
  }
  return { events: bundleEvents, truncated }
}

/** Events whose addons the shown dev bundles compare */
export const getAddonEventIds = (history: BundleHistory | undefined, sources: BundleSource[]) =>
  sources
    .filter((source) => !source.variant)
    .flatMap((source) =>
      getBundleEvents(history?.events ?? [], source.title).events.map((event) => event.id),
    )

/** Addons whose version differs, by name */
export const diffAddons = (before: BundleAddons, after: BundleAddons): AddonChange[] =>
  [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .sort()
    .map((name) => ({ name, before: before[name] ?? null, after: after[name] ?? null }))
    .filter((change) => change.before !== change.after)

/** `core 1.2.0 → 1.3.0`, `core added 1.3.0`, `core removed 1.2.0` */
export const describeAddonChange = ({ name, before, after }: AddonChange) => {
  if (before && after) return `${name} ${before} → ${after}`
  return after ? `${name} added ${after}` : `${name} removed ${before}`
}

/**
 * The creation and the addon version changes of a bundle, from its events and the addons after each
 * (by event id, null when the event is gone). Saves that set the same versions again, like those
 * of dev paths, are left out. Events whose addons are not loaded yet wait, with those after them.
 */
export const getAddonChanges = (
  events: BundleEvent[],
  addons: Record<string, BundleAddons | null>,
  source: BundleSource,
): BundleChange[] => {
  const changes: BundleChange[] = []
  let before: BundleAddons | null = null
  for (const event of events) {
    if (!(event.id in addons)) break
    const after = addons[event.id]
    const diff = before && after ? diffAddons(before, after) : null
    before = after
    if (event.topic === 'bundle.created' || !diff || diff.length) {
      changes.push({ ...toChange(event, source), addons: diff })
    }
  }
  return changes
}

/**
 * One lane with the changes of the shown sources, each in its colour. Its key stays the same, so
 * selecting another bundle keeps the zoom. `addons`: see `getAddonChanges`.
 */
export const getBundleLane = (
  history: BundleHistory | undefined,
  shown: BundleSource[],
  addons: Record<string, BundleAddons | null>,
): BundleLane => {
  const events = history?.events ?? []
  const changes = shown
    .flatMap((source) =>
      source.variant
        ? getVariantChanges(events, source)
        : getAddonChanges(getBundleEvents(events, source.title).events, addons, source),
    )
    .sort((a, b) => a.createdAt - b.createdAt)
  return {
    key: 'bundles',
    title: shown.length === 1 ? shown[0].title : 'Bundles',
    color: shown.length === 1 ? shown[0].color : OTHER,
    current: '',
    changes,
    truncated: shown.some((source) => source.variant && history?.truncated[source.variant]),
  }
}

/** What a change did, in a line: `A → B`, `core 1.2.0 → 1.3.0`, `3 addons` */
export const describeChange = (change: BundleChange) => {
  if (change.source.variant) {
    const to = change.to ?? 'none'
    return change.from ? `${change.from} → ${to}` : to
  }
  if (change.created) return 'created'
  if (!change.addons) return 'addons changed'
  if (change.addons.length === 1) return describeAddonChange(change.addons[0])
  return `${change.addons.length} addons`
}
