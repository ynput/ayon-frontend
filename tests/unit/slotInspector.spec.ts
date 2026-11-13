import { expect, test } from '@playwright/test'
import {
  addonColor,
  AYON_ADDON,
  getSlotInspector,
  inspectorAddons,
  setAddonHighlighted,
  setHighlightedSlot,
  setShowSlots,
  setSlotInspectorAvailable,
  slotAddons,
  slotOf,
  subscribeSlotInspector,
} from '../../shared/src/components/AddonLayout/slotInspector'
import * as examplesModule from '../../addon/src/examples'
import {
  getContributions,
  getRegistry,
  provideExamples,
  registerManifests,
  setContributionTags,
  setManifestsLoading,
  unregisterAddon,
} from '../../addon/src/registry'

// The slot inspector: developer mode's Show slots, which adds the examples and tags (outlines)
// contributions. It only applies while the inspector is available (developer mode, the dev shell);
// off, nothing is tagged and the registry has no examples.

const run = () => Promise.resolve({ default: () => undefined })
const manifest = (name: string) => ({
  addon: { name, version: '1.0.0', remote: name },
  manifest: { contributes: [{ slot: 'userDetails.menuItem', id: 'log', label: 'Log', icon: 'timer', run }] },
})

test.describe('slot inspector', () => {
  test.beforeEach(() => {
    provideExamples(examplesModule)
    setManifestsLoading(false)
    registerManifests([manifest('zebra'), manifest('alpha')])
  })
  test.afterEach(() => {
    setShowSlots(false)
    setAddonHighlighted('alpha', true)
    setHighlightedSlot(undefined)
    setSlotInspectorAvailable(false)
    unregisterAddon('zebra')
    unregisterAddon('alpha')
  })

  test("defaults apply to a session that hasn't set the switches, once", () => {
    // first: no session storage here, and nothing has made it available yet
    setSlotInspectorAvailable(true, { showSlots: true })
    expect(getSlotInspector().showSlots).toBe(true)
    setShowSlots(false)
    setSlotInspectorAvailable(false)
    setSlotInspectorAvailable(true, { showSlots: true })
    expect(getSlotInspector().showSlots).toBe(false)
  })

  test('Show slots applies only while it is available', () => {
    setShowSlots(true)
    expect(getRegistry()).toMatchObject({ examples: false, tagged: false })
    setSlotInspectorAvailable(true)
    expect(getRegistry()).toMatchObject({ examples: true, tagged: true })
    setSlotInspectorAvailable(false)
    expect(getRegistry()).toMatchObject({ examples: false, tagged: false })
  })

  test('Show slots adds the examples and tags contributions', () => {
    setSlotInspectorAvailable(true)
    expect(getRegistry()).toMatchObject({ examples: false, tagged: false })
    setShowSlots(true)
    expect(getRegistry()).toMatchObject({ examples: true, tagged: true })
  })

  test('the legend: AYON first, then the addons by name, each with its colour', () => {
    expect(inspectorAddons()).toEqual([AYON_ADDON, 'alpha', 'zebra'])
    expect(addonColor(AYON_ADDON)).toBe('var(--md-sys-color-tertiary)')
    expect(addonColor('alpha')).not.toBe(addonColor('zebra'))
    expect(addonColor('alpha')).toMatch(/^#[0-9a-f]{6}$/)
    setAddonHighlighted('alpha', false)
    expect(getSlotInspector().hiddenAddons).toEqual(['alpha'])
    setAddonHighlighted('alpha', true)
    expect(getSlotInspector().hiddenAddons).toEqual([])
  })

  test('listeners hear each change once', () => {
    const heard: unknown[] = []
    const unsubscribe = subscribeSlotInspector(() => heard.push(getSlotInspector().hovered))
    setHighlightedSlot('userDetails.menuItem')
    setHighlightedSlot('userDetails.menuItem')
    setHighlightedSlot(undefined)
    unsubscribe()
    expect(heard).toEqual(['userDetails.menuItem', undefined])
  })

  test("a menu's button only names its slot: its addons come from the registry", () => {
    const button = {
      getAttribute: (name: string) => (name === 'data-ayon-trigger' ? 'userDetails.menuItem' : null),
    } as unknown as Element
    expect(slotOf(button)).toBe('userDetails.menuItem')
    expect(slotAddons('userDetails.menuItem')).toEqual(['zebra', 'alpha'])
    setSlotInspectorAvailable(true)
    setShowSlots(true)
    // AYON's example is in the menu too, after the real ones
    expect(slotAddons('userDetails.menuItem')).toEqual(['zebra', 'alpha', 'ayon'])
    expect(slotAddons('projectList.menuItem')).toEqual(['ayon'])
  })

  test("a tag switch is a registry change: surfaces re-render through useContributions", () => {
    const before = getContributions('userDetails.menuItem')
    setContributionTags(true)
    const tagged = getContributions('userDetails.menuItem')
    expect(tagged).not.toBe(before)
    setContributionTags(false)
    expect(getContributions('userDetails.menuItem')).not.toBe(tagged)
  })
})
