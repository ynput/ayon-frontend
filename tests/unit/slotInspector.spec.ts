import { expect, test } from '@playwright/test'
import {
  addonColor,
  AYON_ADDON,
  getSlotInspector,
  inspectorAddons,
  setAddonHighlighted,
  setHighlightContributions,
  setHighlightedSlot,
  setShowSlots,
  setSlotInspectorAvailable,
  subscribeSlotInspector,
  useSlotTriggerProps,
} from '../../shared/src/components/AddonLayout/slotInspector'
import * as examplesModule from '../../addon/src/examples'
import {
  getRegistry,
  provideExamples,
  registerManifests,
  setManifestsLoading,
  unregisterAddon,
} from '../../addon/src/registry'
import { renderToHtml } from './support/render'

// The slot inspector: developer mode's Show slots and Highlight contributions. The switches only
// apply while the inspector is available (developer mode, the dev shell); with both off nothing is
// tagged and the registry has no examples.

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
    setHighlightContributions(false)
    setAddonHighlighted('alpha', true)
    setHighlightedSlot(undefined)
    setSlotInspectorAvailable(false)
    unregisterAddon('zebra')
    unregisterAddon('alpha')
  })

  test("defaults apply to a session that hasn't set the switches, once", () => {
    // first: no session storage here, and nothing has made it available yet
    setSlotInspectorAvailable(true, { highlight: true })
    expect(getSlotInspector().highlight).toBe(true)
    setHighlightContributions(false)
    setSlotInspectorAvailable(false)
    setSlotInspectorAvailable(true, { highlight: true })
    expect(getSlotInspector().highlight).toBe(false)
  })

  test('the switches apply only while it is available', () => {
    setShowSlots(true)
    setHighlightContributions(true)
    expect(getRegistry()).toMatchObject({ examples: false, tagged: false })
    setSlotInspectorAvailable(true)
    expect(getRegistry()).toMatchObject({ examples: true, tagged: true })
    setSlotInspectorAvailable(false)
    expect(getRegistry()).toMatchObject({ examples: false, tagged: false })
  })

  test('Highlight contributions tags without examples; Show slots tags too', () => {
    setSlotInspectorAvailable(true)
    expect(getRegistry()).toMatchObject({ examples: false, tagged: false })
    setHighlightContributions(true)
    expect(getRegistry()).toMatchObject({ examples: false, tagged: true })
    setHighlightContributions(false)
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

  test("tags a menu's button with the addons of its slot, only while it tags contributions", () => {
    let props: unknown
    const Button = () => {
      props = useSlotTriggerProps('userDetails.menuItem')
      return null
    }
    renderToHtml(Button)
    expect(props).toBeUndefined()
    setSlotInspectorAvailable(true)
    setHighlightContributions(true)
    renderToHtml(Button)
    expect(props).toEqual({
      'data-ayon-slot': 'userDetails.menuItem',
      'data-ayon-trigger': '',
      'data-ayon-addons': 'zebra alpha',
    })
  })
})
