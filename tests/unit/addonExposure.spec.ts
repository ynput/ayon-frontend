import { expect, test } from '@playwright/test'
import { checkManifest } from '../../addon/src/validate'
import { SLOTS } from '../../addon/src/slots'
import type { SlotName } from '../../addon/src/slots'
import { exampleFields, SLOT_EXAMPLES } from '../../addon/src/slotExamples'
import { contributionExposureLevel, EXPOSURE, isExposed } from '../../addon/src/exposure'
import {
  getContributions,
  getRegistry,
  registerManifest,
  setExposureLevel,
  setManifestsLoading,
  unregisterAddon,
} from '../../addon/src/registry'
import { exposureNote } from '../../addon-dev/src/check'

const addon = { name: 'invoices', version: '1.0.0', remote: 'invoices' }
const loader = () => Promise.resolve({ default: () => null })
const tab = (fields: object = {}) => ({
  slot: 'detailsPanel.tab',
  id: 'invoices',
  label: 'Invoices',
  icon: 'receipt',
  component: loader,
  ...fields,
})
const ids = (slot: SlotName) => getContributions(slot).contributions.map((c) => c.id)

test.beforeEach(() => {
  setManifestsLoading(false)
  setExposureLevel(undefined)
})

test.afterEach(() => unregisterAddon(addon.name))

test('EXPOSURE has the levels the server gives each role', () => {
  expect(EXPOSURE).toEqual({ guest: 100, user: 500, manager: 700, admin: 900 })
})

test('minExposureLevel must be a whole number from 0 to 1000', () => {
  const { contributions, skipped } = checkManifest(addon, {
    contributes: [
      tab({ id: 'none' }),
      tab({ id: 'zero', minExposureLevel: 0 }),
      tab({ id: 'manager', minExposureLevel: EXPOSURE.manager }),
      tab({ id: 'between', minExposureLevel: 600 }),
      tab({ id: 'text', minExposureLevel: 'manager' }),
      tab({ id: 'fraction', minExposureLevel: 700.5 }),
      tab({ id: 'negative', minExposureLevel: -1 }),
      tab({ id: 'tooHigh', minExposureLevel: 1001 }),
    ],
  })
  expect(contributions.map((c) => c.id)).toEqual(['none', 'zero', 'manager', 'between'])
  expect(skipped.map((s) => s.id)).toEqual(['text', 'fraction', 'negative', 'tooHigh'])
  expect(skipped[0].reason).toBe(
    'minExposureLevel must be a whole number from 0 to 1000, e.g. EXPOSURE.manager (700)',
  )
})

test("a page's access is the same check; with both, the higher level wins", () => {
  expect(contributionExposureLevel({})).toBe(0)
  expect(contributionExposureLevel({ access: 'manager' })).toBe(700)
  expect(contributionExposureLevel({ access: 'admin' })).toBe(900)
  expect(contributionExposureLevel({ access: 'manager', minExposureLevel: 900 })).toBe(900)
  expect(contributionExposureLevel({ access: 'admin', minExposureLevel: 500 })).toBe(900)
  // an unknown user sees only what has no level
  expect(isExposed({}, undefined)).toBe(true)
  expect(isExposed({ minExposureLevel: 100 }, undefined)).toBe(false)
  expect(isExposed({ access: 'manager' }, 700)).toBe(true)
  expect(isExposed({ access: 'manager' }, 500)).toBe(false)
})

test('the registry hides what the user level does not reach, and shows it again', () => {
  registerManifest(addon, {
    contributes: [
      tab({ id: 'everyone' }),
      tab({ id: 'managers', minExposureLevel: EXPOSURE.manager }),
      { slot: 'project.page', id: 'billing', title: 'Billing', access: 'admin', component: loader },
    ],
  })
  // the user isn't known yet
  expect(ids('detailsPanel.tab')).toEqual(['everyone'])
  expect(getRegistry().hidden.map((c) => c.id)).toEqual(['managers', 'billing'])

  setExposureLevel(EXPOSURE.user)
  expect(ids('detailsPanel.tab')).toEqual(['everyone'])
  expect(ids('project.page')).toEqual([])

  setExposureLevel(EXPOSURE.manager)
  const managers = getContributions('detailsPanel.tab').contributions[1]
  expect(ids('detailsPanel.tab')).toEqual(['everyone', 'managers'])
  expect(ids('project.page')).toEqual([])
  expect(getRegistry().hidden.map((c) => c.id)).toEqual(['billing'])

  setExposureLevel(EXPOSURE.admin)
  expect(ids('project.page')).toEqual(['billing'])
  expect(getRegistry().hidden).toEqual([])
  // the same object: surfaces keep their state when the level changes
  expect(getContributions('detailsPanel.tab').contributions[1]).toBe(managers)

  // a user who lowered their own level
  setExposureLevel(EXPOSURE.user)
  expect(ids('detailsPanel.tab')).toEqual(['everyone'])
})

test('every slot hides a contribution above the user level before its code loads', () => {
  let loaded = 0
  const counted = () => {
    loaded += 1
    return loader()
  }
  const slots = Object.keys(SLOTS) as SlotName[]
  const contributes = slots.map((slot) => {
    const fields = exampleFields({ ...SLOTS[slot], example: SLOT_EXAMPLES[slot] })
    for (const key of Object.keys(fields)) if (typeof fields[key] === 'function') fields[key] = counted
    return { ...fields, slot, id: 'gated', minExposureLevel: EXPOSURE.admin }
  })
  const { skipped } = registerManifest(addon, { contributes })
  expect(skipped).toEqual([])

  setExposureLevel(EXPOSURE.manager)
  for (const slot of slots) expect(ids(slot), slot).toEqual([])
  expect(getRegistry().hidden).toHaveLength(slots.length)

  setExposureLevel(EXPOSURE.admin)
  for (const slot of slots) expect(ids(slot), slot).toEqual(['gated'])
  // the registry never calls a piece: surfaces load them, and only for what they get
  expect(loaded).toBe(0)
})

test('the slots of other addons are filtered the same way', () => {
  const owner = { name: 'example', version: '1.0.0', remote: 'example' }
  registerManifest(owner, {
    slots: [{ name: 'example.cardMenuItem', version: 1, required: ['label'], pieces: ['run'] }],
    contributes: [],
  })
  registerManifest(addon, {
    contributes: [
      { slot: 'example.cardMenuItem', id: 'bill', label: 'Bill', run: loader, minExposureLevel: 700 },
    ],
  })
  setExposureLevel(EXPOSURE.user)
  expect(getContributions('example.cardMenuItem' as SlotName).contributions).toEqual([])
  setExposureLevel(EXPOSURE.manager)
  expect(getContributions('example.cardMenuItem' as SlotName).contributions.map((c) => c.id)).toEqual([
    'bill',
  ])
  unregisterAddon(addon.name)
  unregisterAddon(owner.name)
})

test('ayon-addon check notes a level that is none of AYON levels', () => {
  expect(exposureNote(undefined, EXPOSURE)).toBeUndefined()
  expect(exposureNote(700, EXPOSURE)).toBeUndefined()
  expect(exposureNote(600, EXPOSURE)).toBe(
    "minExposureLevel 600 is none of AYON's levels (guest 100, user 500, manager 700, admin 900): use EXPOSURE.<role>",
  )
  // an SDK without EXPOSURE: nothing to compare with
  expect(exposureNote(600, undefined)).toBeUndefined()
})
