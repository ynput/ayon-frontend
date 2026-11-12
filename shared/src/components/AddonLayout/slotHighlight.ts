// Slot highlighting: shows where addon slots sit in AYON's UI. The host menus tag their addon
// entries with their slot, put a placeholder entry in a slot menu that has no items, and mark the
// button that opens a slot's menu. Tags are inert attributes and placeholders appear only while
// highlighting is on, so with it off nothing visible changes.
//
// Nothing in the AYON app turns it on yet. The addon dev shell drives it (its Highlight slots
// switch and the hovered row of its Slots list); an in-app mode would call the same setters:
// `setSlotHighlight(true)`, and `setHighlightedSlot(slot)` to single one slot out.
import { useSyncExternalStore } from 'react'

/** On the document's root while highlighting is on: every rule below is scoped under it. */
export const SLOT_HIGHLIGHT_CLASS = 'ayon-slot-highlight'

export interface SlotHighlightState {
  on: boolean
  /** one slot singled out (stronger outline), e.g. the one under the pointer */
  hovered?: string
}

let state: SlotHighlightState = { on: false }
const listeners = new Set<() => void>()

const STYLES = `
.${SLOT_HIGHLIGHT_CLASS} [data-ayon-slot-entry='used'] {
  outline: 1px dashed color-mix(in srgb, var(--md-sys-color-tertiary) 70%, transparent);
  outline-offset: -1px;
  border-radius: 4px;
}
.${SLOT_HIGHLIGHT_CLASS} [data-ayon-slot-entry='unused'] {
  outline: 1px dashed var(--md-sys-color-tertiary);
  outline-offset: -1px;
  border-radius: 4px;
  opacity: 1 !important;
}
.${SLOT_HIGHLIGHT_CLASS} [data-ayon-slot-entry='unused'],
.${SLOT_HIGHLIGHT_CLASS} [data-ayon-slot-entry='unused'] * {
  color: var(--md-sys-color-tertiary) !important;
}
.${SLOT_HIGHLIGHT_CLASS} [data-ayon-slot-trigger] {
  outline: 1px solid var(--md-sys-color-tertiary);
  outline-offset: 1px;
}`

const hoveredStyles = (slot: string) => {
  const match = `[data-ayon-slot="${CSS.escape(slot)}"]`
  return `
.${SLOT_HIGHLIGHT_CLASS} [data-ayon-slot-entry]${match} {
  outline: 2px solid var(--md-sys-color-tertiary) !important;
  outline-offset: -2px;
}
.${SLOT_HIGHLIGHT_CLASS} [data-ayon-slot-trigger]${match} {
  outline-width: 2px;
}`
}

// the static rules, and the hovered slot's, in the document once highlighting was first turned on
let styles: { base: HTMLStyleElement; hovered: HTMLStyleElement } | undefined
const styleElement = (name: string, css: string) => {
  const element = document.createElement('style')
  element.dataset.ayonSlotHighlight = name
  element.textContent = css
  document.head.appendChild(element)
  return element
}

// a tagged element under the pointer singles out its slot, as hovering it elsewhere does
let pointed: Element | undefined
const onPointerOver = (event: PointerEvent) => {
  const element = (event.target as Element | null)?.closest?.('[data-ayon-slot]')
  if (!element || element === pointed) return
  pointed = element
  setHighlightedSlot(element.getAttribute('data-ayon-slot') || undefined)
}
const onPointerOut = (event: PointerEvent) => {
  if (!pointed || pointed.contains(event.relatedTarget as Node | null)) return
  const slot = pointed.getAttribute('data-ayon-slot')
  pointed = undefined
  if (state.hovered === slot) setHighlightedSlot(undefined)
}

const syncDocument = (previous: SlotHighlightState) => {
  if (typeof document === 'undefined') return
  if (state.on !== previous.on) {
    document.documentElement.classList.toggle(SLOT_HIGHLIGHT_CLASS, state.on)
    if (state.on) {
      document.addEventListener('pointerover', onPointerOver)
      document.addEventListener('pointerout', onPointerOut)
    } else {
      document.removeEventListener('pointerover', onPointerOver)
      document.removeEventListener('pointerout', onPointerOut)
      pointed = undefined
    }
  }
  if (state.on && !styles) {
    styles = { base: styleElement('base', STYLES), hovered: styleElement('hovered', '') }
  }
  if (styles)
    styles.hovered.textContent = state.on && state.hovered ? hoveredStyles(state.hovered) : ''
}

const update = (patch: Partial<SlotHighlightState>) => {
  const next = { ...state, ...patch }
  if (next.on === state.on && next.hovered === state.hovered) return
  const previous = state
  state = next
  syncDocument(previous)
  listeners.forEach((listener) => listener())
}

export const getSlotHighlight = () => state
export const subscribeSlotHighlight = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
/** The highlighting state, re-rendering on changes (for menus built while rendering). */
export const useSlotHighlight = () =>
  useSyncExternalStore(subscribeSlotHighlight, getSlotHighlight, getSlotHighlight)

/** Turns highlighting on or off; off also clears the singled out slot. */
export const setSlotHighlight = (on: boolean) => update(on ? { on } : { on, hovered: undefined })
/** Singles one slot out (a stronger outline), or none. */
export const setHighlightedSlot = (slot?: string) => update({ hovered: slot })

/**
 * A menu entry of a slot, tagged with it: inert attributes the menus put on the entry's element.
 * A placeholder passed through it stays one.
 */
export const slotEntry = <T extends object>(slot: string, item: T): T =>
  ({ 'data-ayon-slot-entry': 'used', ...item, 'data-ayon-slot': slot } as T)

/** Tags a slot's entries (separators and missing ones are left alone). */
export const slotEntries = <T>(slot: string, items: T[]): T[] =>
  items.map((item) =>
    item && typeof item === 'object' && !(item as { separator?: boolean }).separator
      ? slotEntry(slot, item)
      : item,
  )

/** Where a slot's items would be in `Menu`: a disabled entry, only while highlighting is on. */
export const slotPlaceholderEntry = (slot: string, label: string) =>
  state.on
    ? {
        id: `ayon-slot:${slot}`,
        label,
        icon: 'add',
        disabled: true,
        'data-ayon-slot': slot,
        'data-ayon-slot-entry': 'unused',
      }
    : undefined

/** The same for the right-click menus (`command` items). */
export const slotPlaceholder = (slot: string, label: string) => {
  const entry = slotPlaceholderEntry(slot, label)
  return entry && { ...entry, command: () => undefined }
}

/**
 * A slot's entries in a host menu: tagged, or the placeholder when there are none and highlighting
 * is on. `command` for the right-click menus, else `Menu`'s entry.
 */
export const withSlotEntries = <T>(
  slot: string,
  items: T[],
  label: string,
  kind: 'entry' | 'command' = 'entry',
): T[] => {
  if (items.length) return slotEntries(slot, items)
  const placeholder =
    kind === 'command' ? slotPlaceholder(slot, label) : slotPlaceholderEntry(slot, label)
  return placeholder ? [placeholder as T] : []
}

/** On the button that opens a slot's menu: outlined while highlighting is on. */
export const slotTriggerProps = (slot: string) => ({
  'data-ayon-slot': slot,
  'data-ayon-slot-trigger': '',
})
