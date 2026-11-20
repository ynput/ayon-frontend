import { cloneDeep, isEqual } from 'lodash'
import { format, isThisYear, isToday, isYesterday } from 'date-fns'
import type {
  SettingsChange,
  SettingsChangePayload,
} from '@queries/settingsHistory/getSettingsHistory'

/** A setting whose override differs, `undefined` means it was not overridden (default) */
export type OverrideDiff = {
  path: string[]
  before?: unknown
  after?: unknown
  /** only the override changed: the value it inherits now is the one it was overridden with */
  sameValue?: boolean
}

/** Where the overrides of an addon at some moment can be read from */
export type OverridesRef = {
  changeId: string
  side: keyof SettingsChangePayload
  version: string
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Settings that differ between two override snapshots.
 * Dicts only hold the keys that are overridden, lists and values are stored whole.
 */
export const diffOverrides = (
  before: unknown,
  after: unknown,
  path: string[] = [],
): OverrideDiff[] => {
  const a = isPlainObject(before) ? before : {}
  const b = isPlainObject(after) ? after : {}
  const result: OverrideDiff[] = []
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const x = a[key]
    const y = b[key]
    const childPath = [...path, key]
    const recurse =
      (isPlainObject(x) && (isPlainObject(y) || y === undefined)) ||
      (isPlainObject(y) && x === undefined)
    if (recurse) result.push(...diffOverrides(x, y, childPath))
    else if (!isEqual(x, y)) result.push({ path: childPath, before: x, after: y })
  }
  return result
}

/** Comparing with a save compares from just before it, so the save is part of what changed */
export const beforeSave = (change: SettingsChange) => change.createdAt - 1

/** Index of the last change at or before `time` in an ascending list, -1 when all are newer */
export const lastIndexAtOrBefore = (changes: SettingsChange[], time: number) => {
  let lo = 0
  let hi = changes.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (changes[mid].createdAt <= time) lo = mid + 1
    else hi = mid
  }
  return lo - 1
}

/**
 * The overrides an addon had at `time`: as saved by the last change before it (any version of
 * the addon), or, when the history starts later, as they were before the first change.
 */
export const getOverridesRefAt = (changes: SettingsChange[], time: number): OverridesRef | null => {
  const index = lastIndexAtOrBefore(changes, time)
  if (index >= 0) {
    const change = changes[index]
    return { changeId: change.id, side: 'newValue', version: change.addonVersion }
  }
  if (!changes.length) return null
  return { changeId: changes[0].id, side: 'originalValue', version: changes[0].addonVersion }
}

/** An entry of the overrides listing the settings form loads (`/overrides`) */
type OverrideEntry = { path: string[]; type?: string; level: string; value?: unknown }

export const getIn = (obj: unknown, path: string[]) =>
  path.reduce<unknown>((acc, key) => (isPlainObject(acc) ? acc[key] : undefined), obj)

const setIn = (obj: Record<string, unknown>, path: string[], value: unknown) => {
  let node = obj
  for (const key of path.slice(0, -1)) {
    if (!isPlainObject(node[key])) node[key] = {}
    node = node[key] as Record<string, unknown>
  }
  node[path[path.length - 1]] = value
}

/**
 * The saved overrides of one level (studio or project), in the shape the events store them.
 * Rebuilt from the settings and the overrides listing the form already loads: leaves carry their
 * value, lists are stored whole and their items are listed too, branches and groups only hold
 * the leaves listed below them.
 */
export const getLevelOverrides = (
  settings: unknown,
  listing: Record<string, OverrideEntry>,
  level: string,
): Record<string, unknown> => {
  const result: Record<string, unknown> = {}
  const lists: string[][] = []
  const entries = Object.values(listing)
    .filter((entry) => entry.level === level)
    .sort((a, b) => a.path.length - b.path.length)
  for (const { path, type, value } of entries) {
    if (type === 'branch' || type === 'group') continue
    if (lists.some((list) => list.every((key, i) => path[i] === key))) continue
    if (type === 'list') lists.push(path)
    setIn(result, path, type === 'list' ? getIn(settings, path) : value)
  }
  return result
}

/** Marks the overrides that were removed while the value they held is still the one in use */
export const withSameValues = (diffs: OverrideDiff[], settings: unknown): OverrideDiff[] =>
  diffs.map((diff) =>
    diff.before !== undefined &&
    diff.after === undefined &&
    isEqual(diff.before, getIn(settings, diff.path))
      ? { ...diff, sameValue: true }
      : diff,
  )

/** A value to put back in the form, `unpin` removes the override when saving */
export type RevertEntry = { path: string[]; value: unknown; unpin: boolean }

/**
 * What puts the settings back to how they were. Settings that were not overridden then get the
 * value they inherit (`inherited`: the defaults, or the studio settings for a project).
 */
export const getRevertEntries = (diffs: OverrideDiff[], inherited: unknown): RevertEntry[] =>
  diffs.flatMap((diff): RevertEntry[] => {
    if (diff.before !== undefined) return [{ path: diff.path, value: diff.before, unpin: false }]
    const value = getIn(inherited, diff.path)
    return value === undefined ? [] : [{ path: diff.path, value, unpin: true }]
  })

/** A value of another addon version only fits when the setting still exists with the same shape */
export const canStage = (current: unknown, value: unknown) =>
  current !== undefined &&
  value !== undefined &&
  Array.isArray(current) === Array.isArray(value) &&
  (typeof current === typeof value || current === null || value === null)

/** Unsaved settings of one addon: the form data, the changed paths and the paths to unpin */
export type StagedSettings = { data: unknown; changed: string[][]; unpinned: string[][] }

/** Puts the values in the form data as unsaved changes, `skipped` did not fit the settings */
export const stageEntries = (state: StagedSettings, entries: RevertEntry[]) => {
  const data = cloneDeep(state.data) as Record<string, unknown>
  const changed = [...state.changed]
  const unpinned = state.unpinned.filter((path) => !entries.some((e) => isEqual(e.path, path)))
  const skipped: RevertEntry[] = []
  for (const entry of entries) {
    if (!entry.path.length || !canStage(getIn(data, entry.path), entry.value)) {
      skipped.push(entry)
      continue
    }
    setIn(data, entry.path, cloneDeep(entry.value))
    // the changes table matches unpins by identity
    let path = changed.find((p) => isEqual(p, entry.path))
    if (!path) {
      path = entry.path
      changed.push(path)
    }
    if (entry.unpin) unpinned.push(path)
  }
  return { data, changed, unpinned, skipped }
}

/** Diffs by parent, in the order they first appear, so the parent titles show once */
export const groupByParent = (diffs: OverrideDiff[]) => {
  const groups = new Map<string, { parent: string[]; diffs: OverrideDiff[] }>()
  for (const diff of diffs) {
    const parent = diff.path.slice(0, -1)
    const key = JSON.stringify(parent)
    const group = groups.get(key)
    if (group) group.diffs.push(diff)
    else groups.set(key, { parent, diffs: [diff] })
  }
  return [...groups.values()]
}

/** Field id the settings form uses for a path (`data-fieldid`) */
export const getFieldId = (path: string[]) => ['root', ...path].join('_')

type SchemaNode = {
  title?: string
  properties?: Record<string, SchemaNode>
  $ref?: string
  allOf?: SchemaNode[]
  definitions?: Record<string, SchemaNode>
}

const resolveNode = (node: SchemaNode | undefined, root: SchemaNode): SchemaNode | undefined => {
  let current = node
  for (let depth = 0; current && depth < 8; depth++) {
    const ref = current.$ref ?? (current.allOf?.length === 1 ? current.allOf[0].$ref : undefined)
    if (!ref) return current
    current = root.definitions?.[ref.split('/').pop() as string]
  }
  return current
}

/** Titles of each key of a path, falls back to the key when the schema does not know it */
export const getPathTitles = (schema: SchemaNode | undefined, path: string[]): string[] => {
  let node = schema
  return path.map((key) => {
    const property = node ? resolveNode(node, schema as SchemaNode)?.properties?.[key] : undefined
    node = property
    return property?.title || key
  })
}

const truncate = (text: string, length: number) =>
  text.length > length ? `${text.slice(0, length - 1)}…` : text

/** Short, single line representation of a setting value */
export const formatValue = (value: unknown, maxLength = 48): string => {
  if (value === undefined) return 'default'
  if (value === null) return 'none'
  if (typeof value === 'string') return value === '' ? 'empty' : `"${truncate(value, maxLength)}"`
  if (Array.isArray(value)) {
    if (!value.length) return 'empty list'
    if (value.every((v) => typeof v !== 'object' || v === null)) {
      const json = JSON.stringify(value)
      if (json.length <= maxLength) return json
    }
    return `${value.length} item${value.length === 1 ? '' : 's'}`
  }
  if (isPlainObject(value)) return `${Object.keys(value).length} fields`
  return String(value)
}

/** How a setting changed, in one short line: `9 → 8` */
export const describeChange = (diff: OverrideDiff, maxLength = 14) =>
  diff.sameValue
    ? 'override removed'
    : `${formatValue(diff.before, maxLength)} → ${formatValue(diff.after, maxLength)}`

/** What happened to a list, when showing both values does not tell */
export const describeListChange = (before: unknown, after: unknown): string | null => {
  if (!Array.isArray(before) || !Array.isArray(after)) return null
  const added = after.filter((item) => !before.some((b) => isEqual(b, item))).length
  const removed = before.filter((item) => !after.some((a) => isEqual(a, item))).length
  if (before.length === after.length && added === removed && added > 0) {
    return `${added} item${added === 1 ? '' : 's'} changed`
  }
  const parts = []
  if (added) parts.push(`${added} added`)
  if (removed) parts.push(`${removed} removed`)
  if (!parts.length) return 'reordered'
  return parts.join(', ')
}

// muted hues that stay readable on dark surfaces, yellow is kept for the comparison
export const LANE_COLORS = [
  '#7fa7e6',
  '#e0a370',
  '#6fc2c2',
  '#e08fa3',
  '#9fb86f',
  '#b49ad8',
  '#8fb3a6',
  '#a3a9b8',
]

/** Moments in the settings history, the same everywhere */
export const DATE_FORMAT = 'd MMM yyyy, HH:mm'

/** Label of a day in a list of saves, like the inbox */
export const getDayLabel = (time: number) => {
  if (isToday(time)) return 'Today'
  if (isYesterday(time)) return 'Yesterday'
  return format(time, isThisYear(time) ? 'd MMMM' : 'd MMMM yyyy')
}
