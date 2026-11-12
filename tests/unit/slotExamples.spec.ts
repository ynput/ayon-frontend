// Slot examples: what developer mode's Show slots renders in each slot. AYON's examples must be valid
// contributions of their slots as they are, and the registry adds them after the real ones only
// while Show slots is on.
import { expect, test } from '@playwright/test'
import * as examplesModule from '../../addon/src/examples'
import { AYON_OWNER, buildExamples, exampleId } from '../../addon/src/examples'
import {
  contributionTags,
  getRegistry,
  isExample,
  provideExamples,
  registerManifest,
  registerManifests,
  setContributionTags,
  setManifestsLoading,
  setSlotExamples,
  subscribeRegistry,
  unregisterAddon,
} from '../../addon/src/registry'
import { exampleFields, exampleRun, exampleSnippet, exampleView, SLOT_EXAMPLES } from '../../addon/src/slotExamples'
import { SLOT_DOCS } from '../../addon/src/slotDocs'
import { SLOTS } from '../../addon/src/slots'
import type { SlotName } from '../../addon/src/slots'
import { checkManifest, checkSlotDeclarations } from '../../addon/src/validate'

const SLOT_NAMES = Object.keys(SLOTS) as SlotName[]

test('every AYON slot has an example', () => {
  expect(Object.keys(SLOT_EXAMPLES).sort()).toEqual([...SLOT_NAMES].sort())
})

for (const slot of SLOT_NAMES) {
  test(`the example of ${slot} is a valid contribution as it is`, () => {
    const example = SLOT_EXAMPLES[slot]
    expect(example).not.toHaveProperty('id')
    // complete: nothing is filled in, so the docs print exactly what renders
    const item = { id: 'example', ...example, slot, slotVersion: SLOTS[slot].version }
    const { contributions, skipped } = checkManifest(AYON_OWNER, { contributes: [item] })
    expect(skipped).toEqual([])
    expect(contributions).toHaveLength(1)
  })
}

test('a declared slot example is filled in with what it leaves out', () => {
  const fields = exampleFields({
    required: ['label', 'icon'],
    pieces: ['run', 'component'],
    label: 'Card menu item',
    example: { label: 'Open the card' },
  })
  expect(fields).toEqual({ id: 'example', label: 'Open the card', icon: 'extension', run: exampleRun, component: exampleView })
  expect(exampleFields({ required: ['label'], pieces: [] })).toEqual({ id: 'example', label: 'Example' })
})

test('the snippet is a manifest entry, with the helper when the slot has one', () => {
  const source = { required: [], pieces: [], example: SLOT_EXAMPLES['header.item'] }
  expect(exampleSnippet('header.item', source, SLOT_DOCS['header.item'].helper)).toBe(
    [
      'headerItem({',
      "  id: 'example',",
      "  label: 'Example header item',",
      "  icon: 'extension',",
      "  placement: 'right',",
      "  run: () => import('./Run'),",
      '})',
    ].join('\n'),
  )
  expect(exampleSnippet('example.cardBadge', { required: ['label'], pieces: ['component'], label: 'Card badge' })).toBe(
    ["contribute('example.cardBadge', {", "  id: 'example',", "  label: 'Card badge',", "  component: () => import('./Component'),", '})'].join('\n'),
  )
})

const owner = { name: 'example', version: '1.0.0', remote: 'example' }
const declared = (example?: object) =>
  checkSlotDeclarations(owner, {
    slots: [
      {
        name: 'example.cardBadge',
        version: 1,
        label: 'Card badge',
        required: ['label'],
        pieces: ['component'],
        optional: { size: /^(s|m)$/ },
        example,
      },
    ],
  }).slots

test('a declaration example must be an object', () => {
  for (const example of ['badge', [], null]) {
    const { slots, skipped } = checkSlotDeclarations(owner, {
      slots: [{ name: 'example.cardBadge', version: 1, required: [], pieces: ['component'], example }],
    })
    expect(slots).toEqual([])
    expect(skipped[0].reason).toContain('example must be an object')
  }
})

test('examples belong to the slot owner and go last', () => {
  const slots = declared({ label: 'Due' })
  const examples = buildExamples(slots)
  expect(examples).toHaveLength(SLOT_NAMES.length + 1)
  expect(examples.filter((c) => c.addon.name === 'ayon').map((c) => c.slot).sort()).toEqual([...SLOT_NAMES].sort())
  const badge = examples.find((c) => c.slot === 'example.cardBadge')!
  expect(badge).toMatchObject({
    addon: owner,
    id: exampleId('example.cardBadge'),
    key: 'example.example_example_cardBadge',
    label: 'Due',
    order: Number.MAX_SAFE_INTEGER,
    example: true,
  })
  expect(isExample(badge)).toBe(true)
  // an unchanged example is the same contribution: nothing re-renders
  expect(buildExamples(slots).find((c) => c.slot === 'example.cardBadge')).toBe(badge)
})

test('an example its slot skips is left out with a warning', () => {
  const warn = console.warn
  const warnings: unknown[] = []
  console.warn = (line: unknown) => warnings.push(line)
  try {
    const examples = buildExamples(declared({ size: 'xl' }))
    expect(examples.some((c) => c.slot === 'example.cardBadge')).toBe(false)
    expect(warnings).toEqual([expect.stringContaining('[slot example]')])
  } finally {
    console.warn = warn
  }
})

test.describe('Show slots in the registry', () => {
  const contributor = { name: 'contributor', version: '1.0.0', remote: 'contributor' }
  const run = () => Promise.resolve({ default: () => undefined })
  const examplesLoaded = () =>
    new Promise<void>((resolve) => {
      if (getRegistry().contributions.some(isExample)) return resolve()
      const unsubscribe = subscribeRegistry(() => {
        if (!getRegistry().contributions.some(isExample)) return
        unsubscribe()
        resolve()
      })
    })

  test.beforeEach(() => {
    // in the app, Show slots loads it
    provideExamples(examplesModule)
    setManifestsLoading(false)
    registerManifests([
      { addon: contributor, manifest: { contributes: [{ slot: 'userDetails.menuItem', id: 'log', label: 'Log', icon: 'timer', run }] } },
    ])
  })
  test.afterEach(() => {
    setSlotExamples(false)
    setContributionTags(false)
    unregisterAddon('contributor')
  })

  test('off: only the real contributions', () => {
    expect(getRegistry().contributions.some(isExample)).toBe(false)
  })

  test('on: every slot gets its example, after its real contributions', async () => {
    setSlotExamples(true)
    await examplesLoaded()
    const inSlot = getRegistry().contributions.filter((c) => c.slot === 'userDetails.menuItem')
    expect(inSlot.map((c) => c.key)).toEqual(['contributor.log', 'ayon.example_userDetails_menuItem'])
    expect(new Set(getRegistry().contributions.filter(isExample).map((c) => c.slot))).toEqual(new Set(SLOT_NAMES))
    // an addon's own result has no examples
    expect(registerManifest(contributor, { contributes: [] }).contributions).toEqual([])
    setSlotExamples(false)
    expect(getRegistry().contributions.some(isExample)).toBe(false)
  })

  test('tags only while the inspector needs them', () => {
    const log = getRegistry().contributions[0]
    expect(contributionTags(log)).toBeUndefined()
    setContributionTags(true)
    expect(contributionTags(log)).toEqual({
      'data-ayon-addon': 'contributor',
      'data-ayon-slot': 'userDetails.menuItem',
      'data-ayon-contribution': 'contributor.log',
    })
  })
})
