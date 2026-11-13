// The slot inspector: developer mode's Show slots switch and its legend of addons. Show slots adds
// every slot's example contribution (the SDK's registry renders them where the slot's real ones go)
// and outlines every rendered contribution in its addon's colour. While it is on, rendered
// contributions carry `data-ayon-addon`, `data-ayon-slot` and `data-ayon-contribution` (the SDK's
// `contributionTags`) and hovering one shows a card with what it is (SlotInspectorCard); off,
// AYON's DOM has none.
//
// A button that opens a menu with a slot's entries only names the slot, always:
// `data-ayon-trigger="<slot>"`. Everything else about it (whether it is outlined, in which colour,
// what its card says) comes from the registry here, so menus don't follow the inspector's state.
//
// Internal: AYON's header (developer mode) and the addon dev shell drive it, not addons. The
// switch and the legend are kept in session storage.
import { useSyncExternalStore } from 'react'
import {
  getRegistry,
  setContributionTags,
  setContributionWrappers,
  setSlotExamples,
  subscribeRegistry,
} from '@ynput/ayon-addon/host'

export interface SlotInspectorState {
  /** the inspector can be used: developer mode in AYON, always in the dev shell */
  available: boolean
  /** each slot shows its example contribution, and contributions are outlined in their addon's colour */
  showSlots: boolean
  /** addons the legend unchecked: no outlines */
  hiddenAddons: readonly string[]
  /** one slot singled out (a stronger outline), e.g. the one under the pointer */
  hovered?: string
}

/** On the document's root while contributions are outlined: the outline rules are scoped under it. */
export const SLOT_INSPECTOR_CLASS = 'ayon-slot-inspector'

/** The owner of AYON's own slots and their examples. */
export const AYON_ADDON = 'ayon'

const STORAGE_KEY = 'ayon-slot-inspector'

// eight colours apart from each other on dark and light surfaces; AYON's own is the tertiary colour
const PALETTE = ['#4fc3f7', '#ffb74d', '#81c784', '#f06292', '#ba68c8', '#fff176', '#4db6ac', '#ff8a65']

const readStored = (): Pick<SlotInspectorState, 'showSlots' | 'hiddenAddons'> => {
  try {
    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}')
    return {
      showSlots: stored.showSlots === true,
      hiddenAddons: Array.isArray(stored.hiddenAddons)
        ? stored.hiddenAddons.filter((name: unknown) => typeof name === 'string')
        : [],
    }
  } catch {
    return { showSlots: false, hiddenAddons: [] }
  }
}

let state: SlotInspectorState = { available: false, ...readStored() }
// whether the session had a switch of its own when the page loaded: defaults don't override it
let storedAtLoad = (() => {
  try {
    return sessionStorage.getItem(STORAGE_KEY) !== null
  } catch {
    return false
  }
})()
const listeners = new Set<() => void>()

/** Every addon of the legend: AYON first, then the registered addons by name. */
export const inspectorAddons = (): string[] => [
  AYON_ADDON,
  ...getRegistry()
    .addons.map(({ name }) => name)
    .filter((name) => name !== AYON_ADDON)
    .sort((a, b) => a.localeCompare(b)),
]

/** An addon's outline colour: AYON's tertiary colour, the others from the palette by name. */
export const addonColor = (addon: string, addons: readonly string[] = inspectorAddons()) => {
  if (addon === AYON_ADDON) return 'var(--md-sys-color-tertiary)'
  const index = addons.filter((name) => name !== AYON_ADDON).indexOf(addon)
  return PALETTE[(index < 0 ? addons.length : index) % PALETTE.length]
}

const tagsOn = () => state.available && state.showSlots

/**
 * The addons with contributions to a slot, in registry order (a slot's example, AYON's, comes
 * after the real ones): what a menu button of the slot (`data-ayon-trigger`) holds.
 */
export const slotAddons = (slot: string): string[] => [
  ...new Set(
    getRegistry()
      .contributions.filter((c) => c.slot === slot)
      .map((c) => c.addon.name),
  ),
]

/** The slot a tagged element is about: a contribution's, or the one a menu button opens. */
export const slotOf = (element: Element) =>
  element.getAttribute('data-ayon-slot') || element.getAttribute('data-ayon-trigger') || undefined

// the menu buttons of the slots with contributions; those of an empty slot aren't outlined
const triggers = (slots: readonly string[]) =>
  slots.map((slot) => `.${SLOT_INSPECTOR_CLASS} [data-ayon-trigger=${quote(slot)}]`).join(',\n')

const quote = (value: string) => `"${CSS.escape(value)}"`
// what shows a contribution: the tagged element, or the elements of a `display: contents` wrapper
const shown = (match: string) =>
  `.${SLOT_INSPECTOR_CLASS} ${match}:not([data-ayon-wrap]),\n.${SLOT_INSPECTOR_CLASS} [data-ayon-wrap]${match} > *`

const outlineStyles = () => {
  const addons = inspectorAddons()
  const visible = addons.filter((addon) => !state.hiddenAddons.includes(addon))
  // each slot with contributions and their addons: its menu buttons are outlined
  const slots = new Map<string, Set<string>>()
  for (const { slot, addon } of getRegistry().contributions) {
    slots.set(slot, (slots.get(slot) ?? new Set()).add(addon.name))
  }
  const slotsOf = (addon: string) => [...slots].filter(([, of]) => of.has(addon)).map(([slot]) => slot)
  return [
    slots.size
      ? `${triggers([...slots.keys()])} {
  outline: 1px dashed var(--md-sys-color-outline);
  outline-offset: 1px;
}`
      : '',
    ...visible.map((addon) => {
      const menus = slotsOf(addon)
      return `${shown(`[data-ayon-addon=${quote(addon)}]`)} {
  outline: 2px solid ${addonColor(addon, addons)};
  outline-offset: -2px;
  border-radius: 4px;
}${
        menus.length
          ? `
${triggers(menus)} {
  outline: 2px dashed ${addonColor(addon, addons)};
}`
          : ''
      }`
    }),
  ]
    .filter(Boolean)
    .join('\n')
}

const hoveredStyles = (slot: string) => {
  const match = `[data-ayon-slot=${quote(slot)}]`
  const menus = slotAddons(slot).length ? `, [data-ayon-trigger=${quote(slot)}]` : ''
  return `${match}:not([data-ayon-wrap]), [data-ayon-wrap]${match} > *${menus} {
  outline: 3px solid var(--md-sys-color-primary) !important;
  outline-offset: -3px;
}`
}

// the rules, in the document once the inspector was first used
let styles: { outlines: HTMLStyleElement; hovered: HTMLStyleElement } | undefined
const styleElement = (name: string, css: string) => {
  const element = document.createElement('style')
  element.dataset.ayonSlotInspector = name
  element.textContent = css
  document.head.appendChild(element)
  return element
}

// The tagged element the card is about: the one under the pointer, kept a moment after the pointer
// leaves it so it can move onto the card (and while it is on the card).
let inspected: Element | undefined
let hideTimer: ReturnType<typeof setTimeout> | undefined
const inspectedListeners = new Set<() => void>()
const inspect = (element?: Element) => {
  clearTimeout(hideTimer)
  hideTimer = undefined
  const addon = element?.getAttribute('data-ayon-addon')
  const next = addon && state.hiddenAddons.includes(addon) ? undefined : element
  if (next === inspected) return
  inspected = next
  inspectedListeners.forEach((listener) => listener())
  const slot = next && slotOf(next)
  if (state.hovered !== slot) setHighlightedSlot(slot)
}
const subscribeInspected = (listener: () => void) => {
  inspectedListeners.add(listener)
  return () => {
    inspectedListeners.delete(listener)
  }
}
const getInspected = () => inspected
/** The tagged element under the pointer (or the card), re-rendering on changes. */
export const useInspectedElement = () => useSyncExternalStore(subscribeInspected, getInspected, getInspected)
const holdInspected = () => {
  clearTimeout(hideTimer)
  hideTimer = undefined
}
/** The pointer left the element and the card: drop it after a moment, unless it comes back. */
export const releaseInspected = (delay = 200) => {
  if (delay && hideTimer !== undefined) return
  clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    hideTimer = undefined
    inspect(undefined)
  }, delay)
}

const TAGGED = '[data-ayon-contribution], [data-ayon-trigger]'
/** On the card (SlotInspectorCard): the pointer there keeps it. */
export const SLOT_CARD_ATTRIBUTE = 'data-ayon-slot-card'

// The innermost tagged element at a point: every element there, top first, also the ones under an
// element that isn't tagged (an event bar drawn over its badges), and of their tagged ancestors the
// one inside the others (an addon's slot on a page another slot shows, not the page).
// A menu button of a slot without contributions isn't tagged.
const closestTagged = (element: Element | null) => {
  let tagged = element?.closest(TAGGED)
  while (tagged && !tagged.hasAttribute('data-ayon-contribution') && !slotAddons(slotOf(tagged) ?? '').length)
    tagged = tagged.parentElement?.closest(TAGGED)
  return tagged ?? undefined
}
const taggedAt = (x: number, y: number) => {
  let found: Element | undefined
  for (const element of document.elementsFromPoint(x, y)) {
    const tagged = closestTagged(element)
    if (tagged && (!found || (tagged !== found && found.contains(tagged)))) found = tagged
  }
  return found
}

let frame = 0
let point = { x: 0, y: 0 }
const onPointerMove = (event: PointerEvent) => {
  point = { x: event.clientX, y: event.clientY }
  if (frame) return
  frame = requestAnimationFrame(() => {
    frame = 0
    if (document.elementFromPoint(point.x, point.y)?.closest(`[${SLOT_CARD_ATTRIBUTE}]`)) return holdInspected()
    const element = taggedAt(point.x, point.y)
    if (element) inspect(element)
    else if (inspected) releaseInspected()
  })
}
// the pointer left the window
const onPointerOut = (event: PointerEvent) => {
  if (!event.relatedTarget && inspected) releaseInspected()
}

let listening = false
const syncDocument = () => {
  setSlotExamples(state.available && state.showSlots)
  setContributionWrappers(state.available)
  setContributionTags(tagsOn())
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle(SLOT_INSPECTOR_CLASS, tagsOn())
  if (tagsOn() !== listening) {
    listening = tagsOn()
    if (listening) {
      document.addEventListener('pointermove', onPointerMove)
      document.addEventListener('pointerout', onPointerOut)
    } else {
      document.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerout', onPointerOut)
      inspect(undefined)
    }
  }
  if (tagsOn() && !styles) {
    styles = { outlines: styleElement('outlines', ''), hovered: styleElement('hovered', '') }
  }
  if (styles) {
    styles.outlines.textContent = tagsOn() ? outlineStyles() : ''
    styles.hovered.textContent = tagsOn() && state.hovered ? hoveredStyles(state.hovered) : ''
  }
}

// the colours follow the addons that are registered, the menu buttons' outlines their contributions
let watchingRegistry = false
const watchRegistry = () => {
  if (watchingRegistry) return
  watchingRegistry = true
  let { addons, contributions } = getRegistry()
  subscribeRegistry(() => {
    const registry = getRegistry()
    if (registry.addons === addons && registry.contributions === contributions) return
    ;({ addons, contributions } = registry)
    syncDocument()
  })
}

const update = (patch: Partial<SlotInspectorState>) => {
  const next = { ...state, ...patch }
  if (Object.keys(next).every((key) => next[key as keyof SlotInspectorState] === state[key as keyof SlotInspectorState]))
    return
  state = next
  if (state.available) watchRegistry()
  try {
    const { showSlots, hiddenAddons } = state
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ showSlots, hiddenAddons }))
  } catch {
    // no session storage (private mode, tests): the switch just isn't kept
  }
  syncDocument()
  listeners.forEach((listener) => listener())
}

export const getSlotInspector = () => state
export const subscribeSlotInspector = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
/** The inspector's state, re-rendering on changes. */
export const useSlotInspector = () =>
  useSyncExternalStore(subscribeSlotInspector, getSlotInspector, getSlotInspector)

/**
 * Developer mode is on (AYON) or the dev shell runs: Show slots applies. Off: as if it is off.
 * `defaults` are the switch of a session that has not set it yet.
 */
export const setSlotInspectorAvailable = (
  available: boolean,
  defaults?: Partial<Pick<SlotInspectorState, 'showSlots'>>,
) => {
  // only a call with defaults uses them up: the header menu's own call may come first
  const patch = !storedAtLoad && defaults ? defaults : {}
  if (defaults) storedAtLoad = true
  update({ ...patch, available })
}
/** Show slots: every slot shows its example contribution, and contributions are outlined. */
export const setShowSlots = (showSlots: boolean) => update({ showSlots })
/** Shows or hides one addon's outlines (the legend's checkbox). */
export const setAddonHighlighted = (addon: string, highlighted: boolean) =>
  update({
    hiddenAddons: highlighted
      ? state.hiddenAddons.filter((name) => name !== addon)
      : [...state.hiddenAddons.filter((name) => name !== addon), addon],
  })
/** Singles one slot out (a stronger outline), or none. */
export const setHighlightedSlot = (slot?: string) => update({ hovered: slot })
