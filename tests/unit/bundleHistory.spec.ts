import { expect, test } from '@playwright/test'
import type { BundleEvent } from '../../src/services/bundleHistory/getBundleHistory'
import {
  describeAddonChange,
  describeChange,
  diffAddons,
  getAddonChanges,
  getAddonEventIds,
  getBundleEvents,
  getBundleLane,
  getSources,
  getVariantChanges,
} from '../../src/pages/SettingsPage/Bundles/BundleHistory/bundleHistoryHelpers'

let time = 0
const event = (
  name: string,
  topic: 'bundle.created' | 'bundle.updated',
  changedFields: string[],
  flags: Partial<Pick<BundleEvent, 'isProduction' | 'isStaging' | 'isDev'>> = {},
): BundleEvent => ({
  id: `e${++time}`,
  topic,
  createdAt: time * 1000,
  user: 'admin',
  name,
  changedFields,
  isProduction: false,
  isStaging: false,
  isDev: false,
  ...flags,
})

const setProduction = (name: string) =>
  event(name, 'bundle.updated', ['isProduction'], { isProduction: true })
const unsetProduction = (name: string) => event(name, 'bundle.updated', ['isProduction'])

const [PRODUCTION, STAGING, DEV] = getSources([{ name: 'D', isDev: true }, { name: 'A' }])
const historyOf = (events: BundleEvent[]) => ({
  events,
  truncated: { production: false, staging: false, addons: false, created: false },
})

test('sources are production, staging and each dev bundle', () => {
  expect([PRODUCTION.key, STAGING.key, DEV.key]).toEqual(['production', 'staging', 'dev:D'])
  expect(getSources([]).length).toBe(2)
})

test('sources take the colours of the bundle badges, more dev bundles are told apart', () => {
  const colors = getSources([
    { name: 'D', isDev: true },
    { name: 'E', isDev: true },
  ]).map((source) => source.color)
  expect(colors.slice(0, 3)).toEqual([
    'var(--color-hl-production)',
    'var(--color-hl-staging)',
    'var(--color-hl-developer)',
  ])
  expect(new Set(colors).size).toBe(4)
})

test('production is the sequence of bundles set as production, from one to the next', () => {
  const events = [
    event('A', 'bundle.created', [], { isProduction: true }),
    setProduction('B'),
    // a patch that unsets a bundle that was not production changes nothing
    unsetProduction('A'),
    event('B', 'bundle.updated', ['addons']),
    // nor does setting the bundle that is production again
    setProduction('B'),
    unsetProduction('B'),
    unsetProduction('B'),
    event('C', 'bundle.updated', ['isStaging'], { isStaging: true }),
  ]
  const changes = getVariantChanges(events, PRODUCTION)
  expect(
    changes.map(({ bundleName, from, to, created }) => ({ bundleName, from, to, created })),
  ).toEqual([
    { bundleName: 'A', from: undefined, to: 'A', created: true },
    { bundleName: 'B', from: 'A', to: 'B', created: false },
    { bundleName: 'B', from: 'B', to: null, created: false },
  ])
  expect(changes.map(describeChange)).toEqual(['A', 'A → B', 'B → none'])
  expect(getVariantChanges(events, STAGING).map((change) => change.to)).toEqual(['C'])
})

test('an unset before anything was set still counts, the holder is unknown', () => {
  expect(getVariantChanges([unsetProduction('A')], PRODUCTION)[0].to).toBe(null)
})

test('a dev bundle compares the events since it was last created', () => {
  const events = [
    event('D', 'bundle.created', [], { isDev: true }),
    event('D', 'bundle.updated', ['addons', 'addonDevelopment']),
    event('D', 'bundle.created', [], { isDev: true }),
    event('D', 'bundle.updated', ['addonDevelopment']),
    event('B', 'bundle.updated', ['addons']),
    event('D', 'bundle.updated', ['addons']),
  ]
  const { events: bundleEvents, truncated } = getBundleEvents(events, 'D')
  expect(bundleEvents).toEqual([events[2], events[5]])
  expect(truncated).toBe(false)
  expect(getBundleEvents(events.slice(4), 'D').truncated).toBe(true)
  // only dev bundles load the addons of their events
  expect(getAddonEventIds(historyOf(events), [PRODUCTION, DEV])).toEqual([
    events[2].id,
    events[5].id,
  ])
})

test('saves that set the same addon versions again are left out', () => {
  const events = [
    event('D', 'bundle.created', [], { isDev: true }),
    // e.g. a dev path change, the form sends all addons along
    event('D', 'bundle.updated', ['addons', 'addonDevelopment'], { isDev: true }),
    event('D', 'bundle.updated', ['addons'], { isDev: true }),
    event('D', 'bundle.updated', ['addons'], { isDev: true }),
    event('D', 'bundle.updated', ['addons'], { isDev: true }),
  ]
  const [created, devPaths, core, gone, after] = events.map((e) => e.id)
  const changes = getAddonChanges(
    events,
    {
      [created]: { core: '1.0.0' },
      [devPaths]: { core: '1.0.0' },
      [core]: { core: '1.1.0' },
      // the event is gone, what it and the next one changed is not known
      [gone]: null,
      [after]: { core: '1.2.0' },
    },
    DEV,
  )
  expect(changes.map((change) => [change.id, change.addons])).toEqual([
    [created, null],
    [core, [{ name: 'core', before: '1.0.0', after: '1.1.0' }]],
    [gone, null],
    [after, null],
  ])
  expect(changes.map(describeChange)).toEqual([
    'created',
    'core 1.0.0 → 1.1.0',
    'addons changed',
    'addons changed',
  ])
  // events whose addons are not loaded yet wait, with those after them
  expect(getAddonChanges(events, { [created]: {}, [core]: {} }, DEV).map((c) => c.id)).toEqual([
    created,
  ])
})

test('addon changes list the versions that differ, added and removed addons too', () => {
  const changes = diffAddons(
    { core: '1.0.0', maya: '0.5.0', nuke: '0.3.0', houdini: null },
    { core: '1.1.0', maya: '0.5.0', blender: '0.2.0', nuke: null },
  )
  expect(changes).toEqual([
    { name: 'blender', before: null, after: '0.2.0' },
    { name: 'core', before: '1.0.0', after: '1.1.0' },
    { name: 'nuke', before: '0.3.0', after: null },
  ])
  expect(changes.map(describeAddonChange)).toEqual([
    'blender added 0.2.0',
    'core 1.0.0 → 1.1.0',
    'nuke removed 0.3.0',
  ])
})

test('one lane holds the changes of the shown sources in time, each in its colour', () => {
  const events = [
    setProduction('A'),
    event('D', 'bundle.created', [], { isDev: true }),
    event('C', 'bundle.updated', ['isStaging'], { isStaging: true }),
  ]
  const lane = getBundleLane(historyOf(events), [PRODUCTION, STAGING, DEV], {
    [events[1].id]: {},
  })
  expect(lane.changes.map((change) => [change.id, change.color])).toEqual([
    [events[0].id, PRODUCTION.color],
    [events[1].id, DEV.color],
    [events[2].id, STAGING.color],
  ])
  expect(getBundleLane(historyOf(events), [STAGING], {}).changes.map((c) => c.id)).toEqual([
    events[2].id,
  ])
})
