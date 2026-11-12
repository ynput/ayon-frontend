// Where slots sit on the stage, for the slots rendered with the SDK's SlotOutlet and
// useSlotMenuItems (preview scenes, the addon's own slots), and the shell's own stand-ins for
// AYON's. The shell hands this to the SDK as the host's `devSlots` (internal, never set by AYON),
// so scenes need no code for it. Highlight slots (the panel's switch) is the only thing that
// marks them: every slot of the place, an unused one with a "+ label" placeholder where a
// contribution would go, a used one with a light outline around what it contributes. Hovering a
// slot's row in the panel outlines it on stage; hovering it on stage (with Highlight slots on)
// highlights its row.
import { useEffect, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { getRegistry } from '@ynput/ayon-addon/host'
import type { DevSlotItemProps, DevSlotOutletProps, DevSlots } from '@ynput/ayon-addon/host'
import type { SlotMenuItem, SlotName } from '@ynput/ayon-addon'
import { SLOT_DOCS } from '@ynput/ayon-addon/check'
import { slotLabel } from './contractModel'
import { reportMenu, useSlotReport } from './status'

interface SlotOverlay {
  /** Highlight slots */
  highlight: boolean
  /** the slot under the pointer: its row in the panel, or the slot on stage */
  hovered?: string
  /** the slots with an outlet on the stage now */
  mounted: readonly string[]
}

let state: SlotOverlay = { highlight: false, mounted: [] }
const listeners = new Set<() => void>()

/**
 * Menus are built once, when they open, so their entries can't follow the switch or the hovered row
 * through React: each entry carries its slot (`markMenuItem`), and the page's root carries the
 * state, which CSS matches (shell.css, "menus").
 */
let hoverStyle: HTMLStyleElement | undefined
const syncRoot = () => {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('ayon-dev-highlight', state.highlight)
  if (!hoverStyle) {
    hoverStyle = document.createElement('style')
    hoverStyle.dataset.ayonDev = 'hovered-slot'
    document.head.appendChild(hoverStyle)
  }
  const slot = state.hovered && CSS.escape(state.hovered)
  hoverStyle.textContent = slot
    ? `[data-ayon-dev-menu][data-ayon-dev-slot="${slot}"] { outline: 2px solid var(--md-sys-color-tertiary) !important; outline-offset: -2px; }`
    : ''
}

const update = (patch: Partial<SlotOverlay>) => {
  const next = { ...state, ...patch }
  if ((Object.keys(patch) as (keyof SlotOverlay)[]).every((key) => next[key] === state[key])) return
  state = next
  syncRoot()
  listeners.forEach((listener) => listener())
}

export const subscribeSlotOverlay = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
export const getSlotOverlay = () => state
export const useSlotOverlay = () => useSyncExternalStore(subscribeSlotOverlay, getSlotOverlay)
export const setHighlight = (highlight: boolean) => update({ highlight, ...(highlight ? {} : { hovered: undefined }) })

/** A slot's row in the panel is hovered, or none. */
export const hoverSlot = (slot?: string) => update({ hovered: slot })
/** A slot on stage is hovered: it links to its row only while slots are highlighted. */
const hoverOnStage = (slot?: string) => {
  if (state.highlight || !slot) update({ hovered: slot })
}
/** What a slot on stage takes to link to its row. */
export const stageHover = (slot: string) => ({
  onMouseEnter: () => hoverOnStage(slot),
  onMouseLeave: () => hoverOnStage(undefined),
})

const mount = (slot: string) => update({ mounted: [...state.mounted, slot] })
const unmount = (slot: string) => {
  const index = state.mounted.indexOf(slot)
  if (index >= 0) update({ mounted: [...state.mounted.slice(0, index), ...state.mounted.slice(index + 1)] })
}

/** A slot's title and where it shows: its declaration's, or AYON's docs for AYON's slots. */
export const slotInfo = (slot: string) => {
  const declared = getRegistry().slots.find((s) => s.name === slot)
  return {
    label: slotLabel(slot, declared?.label),
    description: declared?.description || SLOT_DOCS[slot as SlotName]?.where,
  }
}

const isUsed = (slot: string) => getRegistry().contributions.some((c) => c.slot === slot)

/** Whether a slot shows its placeholder: unused, with Highlight slots on. */
export const usePlaceholderShown = (slot: string) => {
  const overlay = useSlotOverlay()
  return overlay.highlight && !isUsed(slot)
}

/**
 * How a slot's part of the stage is marked: lightly with Highlight slots when it is used (an unused
 * one has its placeholder instead), strongly while its row is hovered.
 */
export const useSlotMarks = (slot: string) => {
  const overlay = useSlotOverlay()
  const hovered = overlay.hovered === slot
  const marked = overlay.highlight && isUsed(slot)
  return {
    marked,
    hovered,
    className: `${marked ? ' marked' : ''}${hovered ? ' hovered' : ''}`,
  }
}

/** "+ label" where an unused slot's contributions would go, with Highlight slots on. */
export const Placeholder = ({ slot, label }: { slot: string; label?: string }) => {
  const overlay = useSlotOverlay()
  const shown = usePlaceholderShown(slot)
  if (!shown) return null
  const active = overlay.hovered === slot
  return (
    <span className={`ayon-dev-slot${active ? ' active' : ''}`} data-ayon-dev-slot={slot}>
      <span className="ayon-dev-slot-chip" {...stageHover(slot)}>
        + {label || slotInfo(slot).label}
      </span>
    </span>
  )
}

/**
 * What a slot renders on stage (one contribution, or the slot's part of the page), outlined with
 * Highlight slots on and while hovered. Display: contents, so the page lays it out as it does
 * without the shell.
 */
export const SlotFrame = ({
  slot,
  contribution,
  trigger,
  children,
}: {
  slot: string
  /** its key, when it is one contribution */
  contribution?: string
  /** the button that opens a menu slot's menu: outlined with Highlight slots, used or not */
  trigger?: boolean
  children: ReactNode
}) => {
  const overlay = useSlotOverlay()
  const marks = useSlotMarks(slot)
  const className = trigger
    ? `${overlay.highlight ? ' marked trigger' : ''}${marks.hovered ? ' hovered' : ''}`
    : marks.className
  return (
    <span
      className={`ayon-dev-item${className}`}
      data-ayon-dev-slot={slot}
      data-ayon-dev-contribution={contribution}
      {...stageHover(slot)}
    >
      {children}
    </span>
  )
}

const NO_CONTEXT = {}

const Outlet = ({ slot, count, context, children }: DevSlotOutletProps) => {
  useEffect(() => {
    mount(slot)
    return () => unmount(slot)
  }, [slot])
  // what the slot passes here, also with no contributions yet: Context shows it
  useSlotReport(slot, (context as object | undefined) ?? NO_CONTEXT)
  return count ? <>{children}</> : <Placeholder slot={slot} />
}

const Item = ({ slot, contribution, children }: DevSlotItemProps) => {
  return (
    <SlotFrame slot={slot} contribution={contribution}>
      {children}
    </SlotFrame>
  )
}

/** The disabled entry an unused menu slot gets in its menu, with Highlight slots on. */
export const menuMarker = (slot: string) =>
  state.highlight && !isUsed(slot)
    ? ({
        id: `ayon-dev-slot:${slot}`,
        label: `+ ${slotInfo(slot).label}`,
        icon: 'add',
        command: () => undefined,
        disabled: true,
        'data-ayon-dev-slot': slot,
        'data-ayon-dev-menu': 'unused',
      } as SlotMenuItem)
    : undefined

/** The same for AYON's own menus (`Menu`), which take `onClick`, not `command`. */
export const menuMarkerEntry = (slot: string) => {
  const marker = menuMarker(slot)
  if (!marker) return undefined
  const entry: Partial<SlotMenuItem> = { ...marker }
  delete entry.command
  return entry
}

/**
 * A menu entry of a slot, tagged with it: both AYON's menus put unknown fields on the entry's
 * element, so CSS outlines it with Highlight slots on and while its row is hovered.
 */
export const markMenuItem = <T extends object>(slot: string, item: T): T =>
  ({ 'data-ayon-dev-menu': 'used', ...item, 'data-ayon-dev-slot': slot }) as T

/** What the shell gives the SDK (`provideHost({ devSlots })`). */
export const devSlots: DevSlots = {
  Outlet,
  Item,
  menuPlaceholder: menuMarker,
  menuItem: markMenuItem,
  // when the menu opens; after it, in case a scene builds its items while rendering
  menuBuilt: (slot, context) => queueMicrotask(() => reportMenu(slot, context as Record<string, unknown>)),
}
