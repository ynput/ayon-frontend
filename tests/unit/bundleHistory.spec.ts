import { expect, test } from '@playwright/test'
import type { BundleEvent } from '../../src/services/bundleHistory/getBundleHistory'
import {
  describeAddonChange,
  diffAddons,
  getAddonChanges,
  getAddonEventIds,
  getBundleEvents,
  getBundleLanes,
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

test('the production lane is the sequence of bundles set as production', () => {
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
  expect(
    getVariantChanges(events, 'production').map(({ bundleName, value, created }) => ({
      bundleName,
      value,
      created,
    })),
  ).toEqual([
    { bundleName: 'A', value: 'A', created: true },
    { bundleName: 'B', value: 'B', created: false },
    { bundleName: 'B', value: null, created: false },
  ])
  expect(getVariantChanges(events, 'staging').map((change) => change.value)).toEqual(['C'])
})

test('an unset before anything was set still counts, the holder is unknown', () => {
  expect(getVariantChanges([unsetProduction('A')], 'production')[0].value).toBe(null)
})

test('a bundle lane compares the events since the bundle was last created', () => {
  const events = [
    event('A', 'bundle.created', [], { isDev: true }),
    event('A', 'bundle.updated', ['addons', 'addonDevelopment']),
    event('A', 'bundle.created', [], { isDev: true }),
    event('A', 'bundle.updated', ['addonDevelopment']),
    event('B', 'bundle.updated', ['addons']),
    event('A', 'bundle.updated', ['addons']),
  ]
  const { events: bundleEvents, truncated } = getBundleEvents(events, 'A')
  expect(bundleEvents).toEqual([events[2], events[5]])
  expect(truncated).toBe(false)
  expect(getBundleEvents(events.slice(4), 'A').truncated).toBe(true)
  const history = {
    events,
    truncated: { production: false, staging: false, addons: false, created: false },
  }
  expect(getAddonEventIds(history, ['A', 'B'])).toEqual([events[2].id, events[5].id, events[4].id])
})

test('saves that set the same addon versions again are left out', () => {
  const events = [
    event('A', 'bundle.created', [], { isDev: true }),
    // e.g. a dev path change, the form sends all addons along
    event('A', 'bundle.updated', ['addons', 'addonDevelopment'], { isDev: true }),
    event('A', 'bundle.updated', ['addons'], { isDev: true }),
    event('A', 'bundle.updated', ['addons'], { isDev: true }),
    event('A', 'bundle.updated', ['addons'], { isDev: true }),
  ]
  const [created, devPaths, core, gone, after] = events.map((e) => e.id)
  const changes = getAddonChanges(events, {
    [created]: { core: '1.0.0' },
    [devPaths]: { core: '1.0.0' },
    [core]: { core: '1.1.0' },
    // the event is gone, what it and the next one changed is not known
    [gone]: null,
    [after]: { core: '1.2.0' },
  })
  expect(changes.map((change) => [change.id, change.addons])).toEqual([
    [created, null],
    [core, [{ name: 'core', before: '1.0.0', after: '1.1.0' }]],
    [gone, null],
    [after, null],
  ])
  // events whose addons are not loaded yet wait, with those after them
  expect(getAddonChanges(events, { [created]: {}, [core]: {} }).map((c) => c.id)).toEqual([created])
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

test('lanes: production and staging when they have history, then the selected bundles', () => {
  const events = [setProduction('A'), event('D', 'bundle.created', [], { isDev: true })]
  const history = {
    events,
    truncated: { production: false, staging: false, addons: false, created: false },
  }
  const bundles = [{ name: 'A', isProduction: true }, { name: 'D', isDev: true }, { name: 'S' }]
  const lanes = getBundleLanes(history, bundles, ['D', 'gone'], {})
  expect(lanes.map((lane) => [lane.key, lane.title, lane.current])).toEqual([
    ['production', 'Production', 'A'],
    ['bundle-0', 'D', ''],
  ])
  // staging shows once a bundle is staging, even without history
  const staging = getBundleLanes(history, [...bundles, { name: 'T', isStaging: true }], [], {})
  expect(staging.map((lane) => lane.key)).toEqual(['production', 'staging'])
})
