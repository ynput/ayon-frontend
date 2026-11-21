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

/**
 * A change on the bundles timeline. `value`: the bundle holding the variant after the change, null
 * when it was unset. In the lane of a bundle it is empty, the line only shows the bundle exists.
 */
export type BundleChange = TimelineChange & {
  bundleName: string
  value: string | null
  created: boolean
  /** the addon versions it changed, null when not known: the event before it was not loaded */
  addons?: AddonChange[] | null
}

/** `variant`: the lane of which bundle was production or staging, otherwise the lane of a bundle */
export type BundleLane = TimelineLane<BundleChange> & { variant?: BundleVariant }

/** The bundles in the list, as far as the history needs them */
export type ListedBundle = {
  name: string
  isProduction?: boolean
  isStaging?: boolean
  isDev?: boolean
}

export type AddonChange = { name: string; before: string | null; after: string | null }

const FLAGS = { production: 'isProduction', staging: 'isStaging' } as const

const toChange = (event: BundleEvent, value: string | null): BundleChange => ({
  id: event.id,
  createdAt: event.createdAt,
  user: event.user,
  bundleName: event.name,
  value,
  created: event.topic === 'bundle.created',
})

/**
 * Which bundle held a variant over time. Setting a bundle as production does not unset the previous
 * one in the events, so the lane is the sequence of bundles set. Setting the bundle that holds it
 * again changes nothing, an unset only counts for the bundle that held it.
 */
export const getVariantChanges = (events: BundleEvent[], variant: BundleVariant) => {
  const flag = FLAGS[variant]
  const changes: BundleChange[] = []
  let holder: string | null | undefined
  for (const event of events) {
    const touched =
      event.topic === 'bundle.created' ? event[flag] : event.changedFields.includes(flag)
    if (!touched) continue
    const value = event[flag] ? event.name : null
    if (holder !== undefined && (value === holder || (!value && holder !== event.name))) continue
    holder = value
    changes.push(toChange(event, holder))
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

/** Events whose addons the lanes of the selected bundles compare */
export const getAddonEventIds = (history: BundleHistory | undefined, selected: string[]) =>
  selected.flatMap((name) =>
    getBundleEvents(history?.events ?? [], name).events.map((event) => event.id),
  )

/**
 * The creation and the addon version changes of a bundle, from its events and the addons after each
 * (by event id, null when the event is gone). Saves that set the same versions again, like those
 * of dev paths, are left out. Events whose addons are not loaded yet wait, with those after them.
 */
export const getAddonChanges = (
  events: BundleEvent[],
  addons: Record<string, BundleAddons | null>,
): BundleChange[] => {
  const changes: BundleChange[] = []
  let before: BundleAddons | null = null
  for (const event of events) {
    if (!(event.id in addons)) break
    const after = addons[event.id]
    const diff = before && after ? diffAddons(before, after) : null
    before = after
    if (event.topic === 'bundle.created' || !diff || diff.length) {
      changes.push({ ...toChange(event, ''), addons: diff })
    }
  }
  return changes
}

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

// muted hues of the production, staging and dev badges, other bundles grey
const [, , , STAGING, PRODUCTION, DEV, , OTHER] = LANE_COLORS

const VARIANTS: { variant: BundleVariant; title: string; color: string }[] = [
  { variant: 'production', title: 'Production', color: PRODUCTION },
  { variant: 'staging', title: 'Staging', color: STAGING },
]

/**
 * Lanes of which bundle was production and staging, when they have any history, and a lane of the
 * addon changes of each selected bundle. Those lanes are keyed by position, selecting another bundle
 * keeps the zoom. `addons`: see `getAddonChanges`.
 */
export const getBundleLanes = (
  history: BundleHistory | undefined,
  bundles: ListedBundle[],
  selected: string[],
  addons: Record<string, BundleAddons | null>,
): BundleLane[] => {
  const events = history?.events ?? []
  const variantLanes = VARIANTS.map(({ variant, title, color }) => ({
    key: variant,
    variant,
    title,
    color,
    current: bundles.find((bundle) => bundle[FLAGS[variant]])?.name ?? null,
    changes: getVariantChanges(events, variant),
    truncated: !!history?.truncated[variant],
  })).filter((lane) => lane.changes.length || lane.current)
  const bundleLanes = selected.flatMap((name, i) => {
    const bundle = bundles.find((b) => b.name === name)
    if (!bundle) return []
    const { events: bundleEvents, truncated } = getBundleEvents(events, name)
    return [
      {
        key: `bundle-${i}`,
        title: name,
        color: bundle.isDev ? DEV : OTHER,
        current: '',
        changes: getAddonChanges(bundleEvents, addons),
        truncated: !!history && truncated,
      },
    ]
  })
  return [...variantLanes, ...bundleLanes]
}
