import { expect, test } from '@playwright/test'
import type { SettingsChange } from '../../src/services/settingsHistory/getSettingsHistory'
import {
  diffOverrides,
  filterDiffs,
  getLevelOverrides,
  getOverridesRefAt,
  getPathTitles,
  getRevertEntries,
  groupSaves,
  stageEntries,
  withMissing,
  withSameValues,
} from '../../src/containers/AddonSettings/SettingsHistory/settingsHistoryHelpers'
import { getTimeAxis } from '../../src/containers/AddonSettings/SettingsHistory/timeAxis'

const change = (id: string, createdAt: number, addonVersion: string): SettingsChange => ({
  id,
  createdAt,
  addonVersion,
  user: 'admin',
  addonName: 'core',
  variant: 'production',
  projectName: null,
})

test('only the overridden values that differ are reported, lists as a whole', () => {
  const before = {
    studio_name: 'Ynput',
    publish: { ExtractReview: { enabled: true, profiles: [{ name: 'a' }] } },
    tools: { creator: { enabled: false } },
  }
  const after = {
    studio_name: 'Ynput',
    publish: { ExtractReview: { enabled: false, profiles: [{ name: 'a' }, { name: 'b' }] } },
    update_check_interval: 10,
  }
  expect(diffOverrides(before, after)).toEqual([
    { path: ['publish', 'ExtractReview', 'enabled'], before: true, after: false },
    {
      path: ['publish', 'ExtractReview', 'profiles'],
      before: [{ name: 'a' }],
      after: [{ name: 'a' }, { name: 'b' }],
    },
    // a removed override is back to its default
    { path: ['tools', 'creator', 'enabled'], before: false, after: undefined },
    { path: ['update_check_interval'], before: undefined, after: 10 },
  ])
  expect(diffOverrides(after, after)).toEqual([])
})

test('the overrides at a moment come from the last save before it, of any version', () => {
  const changes = [change('a', 100, '1.0.0'), change('b', 200, '1.0.0'), change('c', 300, '1.1.0')]
  expect(getOverridesRefAt(changes, 250)).toEqual({
    changeId: 'b',
    side: 'newValue',
    version: '1.0.0',
  })
  // a save at exactly that moment is included
  expect(getOverridesRefAt(changes, 300)).toEqual({
    changeId: 'c',
    side: 'newValue',
    version: '1.1.0',
  })
  // before the history starts: what the first save started from
  expect(getOverridesRefAt(changes, 50)).toEqual({
    changeId: 'a',
    side: 'originalValue',
    version: '1.0.0',
  })
  expect(getOverridesRefAt([], 50)).toBeNull()
})

test('the saved overrides of one level are rebuilt from what the settings form loads', () => {
  const settings = {
    studio_name: 'Ynput',
    publish: { ExtractReview: { enabled: false, profiles: [{ name: 'a', ext: 'png' }] } },
    tools: { creator: { enabled: true } },
  }
  // shape of GET /overrides: lists are listed with their items, branches above their leaves
  const listing = {
    root_studio_name: { path: ['studio_name'], level: 'studio', value: 'Ynput' },
    root_publish: { path: ['publish'], type: 'branch', level: 'studio' },
    root_publish_ExtractReview: {
      path: ['publish', 'ExtractReview'],
      type: 'group',
      level: 'studio',
    },
    root_publish_ExtractReview_enabled: {
      path: ['publish', 'ExtractReview', 'enabled'],
      level: 'studio',
      value: false,
    },
    root_publish_ExtractReview_profiles: {
      path: ['publish', 'ExtractReview', 'profiles'],
      type: 'list',
      level: 'studio',
    },
    root_publish_ExtractReview_profiles_0_name: {
      path: ['publish', 'ExtractReview', 'profiles', '0', 'name'],
      level: 'studio',
      value: 'a',
    },
    // inherited from the studio on a project page, not a project override
    root_tools_creator_enabled: {
      path: ['tools', 'creator', 'enabled'],
      level: 'default',
      value: true,
    },
  }
  expect(getLevelOverrides(settings, listing, 'studio')).toEqual({
    studio_name: 'Ynput',
    publish: { ExtractReview: { enabled: false, profiles: [{ name: 'a', ext: 'png' }] } },
  })
  expect(getLevelOverrides(settings, listing, 'project')).toEqual({})
})

test('paths are labelled with the schema titles, following references', () => {
  const schema = {
    properties: {
      publish: { title: 'Publish plugins', allOf: [{ $ref: '#/definitions/Publish' }] },
    },
    definitions: {
      Publish: {
        properties: { ExtractReview: { title: 'Extract Review', $ref: '#/definitions/ER' } },
      },
      ER: { properties: { enabled: { title: 'Enabled' } } },
    },
  }
  expect(getPathTitles(schema, ['publish', 'ExtractReview', 'enabled'])).toEqual([
    'Publish plugins',
    'Extract Review',
    'Enabled',
  ])
  expect(getPathTitles(schema, ['publish', 'unknown'])).toEqual(['Publish plugins', 'unknown'])
})

test('a removed override holding the value in use now is only an override change', () => {
  const diffs = diffOverrides({ a: false, b: 1, c: 'x' }, { c: 'y' })
  const settings = { a: false, b: 2, c: 'y' }
  expect(withSameValues(diffs, settings)).toEqual([
    { path: ['a'], before: false, after: undefined, sameValue: true },
    { path: ['b'], before: 1, after: undefined },
    { path: ['c'], before: 'x', after: 'y' },
  ])
})

test('reverting puts back the values of then, settings that were not overridden inherit', () => {
  const diffs = [
    { path: ['a'], before: 1, after: 2 },
    { path: ['b', 'c'], before: undefined, after: true },
    { path: ['gone'], before: undefined, after: 3 },
  ]
  expect(getRevertEntries(diffs, { b: { c: false } })).toEqual([
    { path: ['a'], value: 1, unpin: false },
    { path: ['b', 'c'], value: false, unpin: true },
  ])
})

test('staged values become unsaved changes, unpins share the changed path', () => {
  const state = { data: { a: 2, b: { c: true }, list: [1] }, changed: [['b', 'c']], unpinned: [] }
  const result = stageEntries(state, [
    { path: ['a'], value: 1, unpin: false },
    { path: ['b', 'c'], value: false, unpin: true },
    { path: ['list'], value: 'not a list', unpin: false },
    { path: ['removed'], value: 1, unpin: false },
  ])
  expect(result.data).toEqual({ a: 1, b: { c: false }, list: [1] })
  expect(result.changed).toEqual([['b', 'c'], ['a']])
  // the changes table matches unpins by identity
  expect(result.unpinned[0]).toBe(result.changed[0])
  expect(result.skipped.map((entry) => entry.path)).toEqual([['list'], ['removed']])
  // the form data it started from is left alone
  expect(state.data.a).toBe(2)
})

test('settings the current version does not have are marked, the others are left as they are', () => {
  const diffs = [
    { path: ['publish', 'enabled'], before: true },
    { path: ['media', 'enabled'], before: true },
  ]
  expect(withMissing(diffs, { publish: { enabled: false } })).toEqual([
    { path: ['publish', 'enabled'], before: true },
    { path: ['media', 'enabled'], before: true, missing: true },
  ])
})

test('axis cells stay on the calendar while the view pans', () => {
  const day = 86_400_000
  const msPerPx = day / 100
  const start = new Date(2026, 10, 3, 15, 20).getTime()
  const axis = getTimeAxis(start, start + 14 * day, msPerPx)
  const panned = getTimeAxis(start + 1.3 * day, start + 15.3 * day, msPerPx)
  const starts = new Set(axis.secondary.map((cell) => cell.start))
  // every cell both views show starts at the same moment, a local midnight
  const shared = panned.secondary.filter((cell) => starts.has(cell.start))
  expect(shared.length).toBe(panned.secondary.length - 1)
  for (const cell of axis.secondary) expect(new Date(cell.start).getHours()).toBe(0)
  expect(axis.secondary[0].label).toBe('Tue 3')
  expect(axis.secondary.find((cell) => cell.label === 'Sat 7')?.weekend).toBe(true)
  expect(axis.primary.map((cell) => cell.label)).toEqual(['November 2026'])
})

test('weeks start on Monday, months and years take over when zoomed out', () => {
  const day = 86_400_000
  const start = new Date(2026, 10, 4).getTime()
  const weeks = getTimeAxis(start, start + 60 * day, day / 6)
  expect(weeks.secondary.every((cell) => new Date(cell.start).getDay() === 1)).toBe(true)
  expect(weeks.primary[0].label).toBe('November 2026')
  const months = getTimeAxis(start, start + 400 * day, day / 2)
  expect(months.secondary[0].label).toBe('Nov')
  expect(months.primary.map((cell) => cell.label)).toEqual(['2026', '2027'])
  const years = getTimeAxis(start, start + 3000 * day, 2 * day)
  expect(years.secondary[0].label).toBe('2026')
  expect(years.primary).toEqual([])
})

test('saves in a row by one user in one version share a run, a day or version starts a new one', () => {
  const at = (day: number, hour: number) => new Date(2025, 2, day, hour).getTime()
  const save = (id: string, createdAt: number, user: string, version = '1.0.0') => ({
    change: { ...change(id, createdAt, version), user },
  })
  const days = groupSaves([
    save('a', at(12, 15), 'roy'),
    save('b', at(12, 14), 'roy'),
    save('c', at(12, 13), 'luke'),
    save('d', at(12, 12), 'roy'),
    save('e', at(12, 11), 'roy', '0.9.0'),
    save('f', at(11, 18), 'roy', '0.9.0'),
  ])
  const ids = days.map((day) => day.runs.map((run) => run.map((s) => s.change.id).join('')))
  expect(ids).toEqual([['ab', 'c', 'd', 'e'], ['f']])
})

test('the history of a setting holds what is inside it, and the list a setting is in', () => {
  const diffs = [
    { path: ['publish', 'ExtractReview', 'enabled'] },
    { path: ['publish', 'ExtractReview', 'profiles'] },
    { path: ['publish', 'ExtractBurnin', 'enabled'] },
  ]
  const paths = (path: (string | number)[]) =>
    filterDiffs(diffs, path).map((diff) => diff.path.join('/'))
  expect(paths(['publish', 'ExtractReview'])).toEqual([
    'publish/ExtractReview/enabled',
    'publish/ExtractReview/profiles',
  ])
  expect(paths(['publish', 'ExtractReview', 'profiles', 0, 'name'])).toEqual([
    'publish/ExtractReview/profiles',
  ])
  expect(paths(['publish', 'ExtractRev'])).toEqual([])
})
