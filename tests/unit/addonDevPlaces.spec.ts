// The dev shell's places: where each slot shows, how many of a place's slots the addon uses,
// old links read as the place they meant, and the manifest entry offered for a slot without a
// preview.
import { expect, test } from '@playwright/test'
import {
  AYON_PLACES,
  buildPlaces,
  listedPlaces,
  listedSlots,
  manifestSnippet,
  normalizeParams,
  OTHER_PLACE,
  placeOfSlot,
  placeSummary,
  placeUsage,
  searchPlaces,
  usedSlots,
} from '../../addon-dev/shell/src/places'
import type { Contract } from '../../addon-dev/shell/src/contractModel'
import { SLOTS } from '../../addon/src/slots'
import { SLOT_DOCS } from '../../addon/src/slotDocs'

const ayonSlots = Object.keys(SLOTS)
const ayonDescriptions = Object.fromEntries(Object.entries(SLOT_DOCS).map(([slot, doc]) => [slot, doc.where]))

const PACKAGE = '@example/contract'
const scene = (id: string, label: string, slots: string[]) =>
  ({ key: `${PACKAGE}:${id}`, id, label, slots, fields: [], component: () => null }) as never
// a contract package: four slots, a scene renders three of them
const contract = {
  package: PACKAGE,
  addons: ['example'],
  problems: [],
  slots: [
    { name: 'example.cardBadge', label: 'Card badge', description: 'a badge on a card' },
    { name: 'example.cardMenuItem', label: 'Card menu item' },
    { name: 'example.cardEndItem', label: 'Card end item' },
    { name: 'example.boardDialog', label: 'Board dialog' },
  ],
  scenes: [scene('card', 'Card', ['example.cardBadge', 'example.cardMenuItem', 'example.cardEndItem'])],
} as unknown as Contract

const places = buildPlaces({
  ayonSlots,
  ayonDescriptions,
  contracts: [contract],
  declared: [{ name: 'example.ownSlot', description: 'a slot the addon declares itself' }],
})
const place = (id: string) => places.find((p) => p.id === id)!

test('every AYON slot has a place, or is under Other slots', () => {
  for (const slot of ayonSlots) {
    const id = placeOfSlot(places, slot)
    expect(id, slot).toBeDefined()
    expect(place(id!).slots.map((s) => s.slot), slot).toContain(slot)
  }
  // the catalog names only slots the SDK has
  for (const p of AYON_PLACES) for (const s of p.slots) expect(ayonSlots, s.slot).toContain(s.slot)
  // AYON's places carry where each slot shows
  expect(place('details-panel').slots[0]).toMatchObject({
    slot: 'detailsPanel.tab',
    label: 'Tab',
    description: SLOT_DOCS['detailsPanel.tab'].where,
  })
})

test('a slot the catalog misses goes to Other slots, never nowhere', () => {
  const withNew = buildPlaces({ ayonSlots: [...ayonSlots, 'brandNew.slot'] })
  expect(placeOfSlot(withNew, 'brandNew.slot')).toBe(OTHER_PLACE)
  expect(withNew.at(-1)).toMatchObject({ id: OTHER_PLACE, label: 'Other slots', kind: 'other' })
  expect(placeOfSlot(withNew, 'unknown.slot')).toBeUndefined()
})

test('a scene is a place under its package; unrendered and own slots are Other slots', () => {
  expect(place(`${PACKAGE}:card`)).toMatchObject({ label: 'Card', source: PACKAGE, kind: 'scene' })
  expect(place(`${PACKAGE}:card`).slots[1]).toEqual({ slot: 'example.cardMenuItem', label: 'Card menu item' })
  expect(place(OTHER_PLACE).slots.map((s) => s.slot)).toEqual(['example.boardDialog', 'example.ownSlot'])
  expect(place(OTHER_PLACE).slots[1]).toMatchObject({ label: 'Own slot', description: 'a slot the addon declares itself' })
})

test('usage counts distinct slots, not contributions', () => {
  const used = usedSlots([
    { slot: 'example.cardBadge' },
    { slot: 'example.cardBadge' },
    { slot: 'example.cardEndItem' },
  ])
  expect(placeUsage(place(`${PACKAGE}:card`), used)).toEqual({ used: 2, total: 3 })
  expect(placeSummary(place(`${PACKAGE}:card`), used)).toBe('2 of 3 used')
  expect(placeSummary(place('details-panel'), used)).toBe('Unused')
  expect(placeSummary(place(OTHER_PLACE), used)).toBe('No preview')
  expect(placeSummary(place('background'), used, 1)).toBe('1 service')
  expect(placeSummary(place('background'), used, 2)).toBe('2 services')
  // a slot listed twice in one place counts once
  const twice = { ...place('details-panel'), slots: [...place('details-panel').slots, place('details-panel').slots[0]] }
  expect(placeUsage(twice, usedSlots([{ slot: 'detailsPanel.tab' }]))).toEqual({ used: 1, total: 2 })
})

test('the panel lists used places and slots; Show unused slots lists all of them', () => {
  const used = usedSlots([{ slot: 'example.cardBadge' }, { slot: 'tableColumn' }])
  expect(listedPlaces(places, used, false).map((p) => p.id)).toEqual(['project-tables', `${PACKAGE}:card`])
  // the selected place stays listed
  expect(listedPlaces(places, used, false, 'profile').map((p) => p.id)).toContain('profile')
  expect(listedPlaces(places, used, true)).toHaveLength(places.length)
  expect(listedSlots(place(`${PACKAGE}:card`), used, false).map((s) => s.slot)).toEqual(['example.cardBadge'])
  // the focused slot stays listed
  expect(listedSlots(place(`${PACKAGE}:card`), used, false, 'example.cardEndItem')).toHaveLength(2)
  expect(listedSlots(place(`${PACKAGE}:card`), used, true)).toHaveLength(3)
})

test('search finds places by name or package, and slots by label, name or contribution', () => {
  const ids = (query: string, titles?: (slot: string) => string[]) =>
    searchPlaces(places, query, titles).map(({ place, slots }) => [place.id, slots.map((s) => s.slot)])
  expect(ids('details panel')).toEqual([['details-panel', ['detailsPanel.tab', 'detailsPanel.menuItem']]])
  expect(ids('@example/')[0][0]).toBe(`${PACKAGE}:card`)
  expect(ids('end item')).toEqual([[`${PACKAGE}:card`, ['example.cardEndItem']]])
  expect(ids('status light', (slot) => (slot === 'header.item' ? ['Status light'] : []))).toEqual([['app-header', ['header.item']]])
  expect(ids('  ')).toHaveLength(places.length)
})

test('old links are read as the place they meant', () => {
  const read = (search: string) => Object.fromEntries(normalizeParams(search, places))
  // a scene
  expect(read(`?scene=${encodeURIComponent(`${PACKAGE}:card`)}&slot=example.cardEndItem&contribution=dot`)).toEqual({
    surface: `${PACKAGE}:card`,
    slot: 'example.cardEndItem',
    contribution: 'dot',
  })
  // a scene that doesn't render the slot: the slot's place
  expect(read(`?scene=${encodeURIComponent(`${PACKAGE}:card`)}&slot=tableColumn`).surface).toBe('project-tables')
  // `ayon-addon open <slot> <id>`
  expect(read('?slot=entityMenuItem&contribution=start')).toEqual({
    slot: 'entityMenuItem',
    contribution: 'start',
    surface: 'project-tables',
  })
  expect(read('?slot=example.boardDialog').surface).toBe(OTHER_PLACE)
  // the old outline toggle is gone; a surface given wins
  expect(read('?showSlots=0&surface=profile&slot=tableColumn')).toEqual({ surface: 'profile', slot: 'tableColumn' })
  expect(read('?slot=unknown.slot')).toEqual({ slot: 'unknown.slot' })
})

test('the manifest entry for a slot comes from its declaration only', () => {
  expect(manifestSnippet({ name: 'detailsPanel.tab', ...SLOTS['detailsPanel.tab'] }, 'detailsPanelTab')).toBe(
    [
      "import { detailsPanelTab } from '@ynput/ayon-addon/manifest'",
      '',
      'detailsPanelTab({',
      "  id: 'my_contribution',",
      "  label: '…',",
      "  icon: 'extension',",
      "  component: () => import('./Tab'),",
      '})',
    ].join('\n'),
  )
  // no required piece: which optional one it takes
  expect(manifestSnippet({ name: 'table.shortcut', ...SLOTS['table.shortcut'] }, 'tableShortcut')).toContain(
    '  // and one of: run, dialog',
  )
  // an addon's slot: contribute, with its version when not 1
  expect(
    manifestSnippet({ name: 'example.boardDialog', version: 2, required: ['id', 'title'], pieces: ['component'] }),
  ).toBe(
    [
      "import { contribute } from '@ynput/ayon-addon/manifest'",
      '',
      "contribute('example.boardDialog', {",
      "  id: 'my_contribution',",
      '  slotVersion: 2,',
      "  title: '…',",
      "  component: () => import('./BoardDialog'),",
      '})',
    ].join('\n'),
  )
  expect(manifestSnippet({ name: 'example.x', version: 1, pieces: ['component'], optionalPieces: ['run'] })).toContain(
    '  // optional: run',
  )
})
