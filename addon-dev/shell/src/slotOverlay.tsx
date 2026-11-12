// Where slots sit on the stage, for the slots rendered with the SDK's SlotOutlet and
// useSlotMenuItems (preview scenes, the addon's own slots), and the shell's own stand-ins for
// AYON's. The shell hands this to the SDK as the host's `devSlots` (internal, never set by AYON),
// so scenes need no code for it. Highlight slots (the panel's switch) is the only thing that
// marks them: every slot of the place, an unused one with a "+ label" placeholder where a
// contribution would go, a used one with a light outline around what it contributes. Hovering a
// slot's row in the panel outlines it on stage; hovering it on stage (with Highlight slots on)
// highlights its row.
//
// The switch and the hovered slot are AYON's slot highlighting (`slotHighlight` in the shared
// package), which also marks the entries of AYON's menus and the buttons that open them. This
// file adds what only the shell has: the outlets' placeholders and the frames around what slots
// render on stage.
import type { ReactNode } from 'react'
import { getRegistry } from '@ynput/ayon-addon/host'
import type { DevSlotItemProps, DevSlotOutletProps, DevSlots } from '@ynput/ayon-addon/host'
import type { SlotMenuItem, SlotName } from '@ynput/ayon-addon'
import { SLOT_DOCS } from '@ynput/ayon-addon/check'
import {
  getSlotHighlight,
  setHighlightedSlot,
  slotEntry,
  slotPlaceholder,
  useSlotHighlight,
} from '@ynput/ayon-frontend-shared/components'
import { slotLabel } from './contractModel'
import { reportMenu, useSlotReport } from './status'

/** A slot on stage is hovered: it links to its row only while slots are highlighted. */
const hoverOnStage = (slot?: string) => {
  if (getSlotHighlight().on || !slot) setHighlightedSlot(slot)
}
/** What a slot on stage takes to link to its row. */
export const stageHover = (slot: string) => ({
  onMouseEnter: () => hoverOnStage(slot),
  onMouseLeave: () => hoverOnStage(undefined),
})

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
  const { on } = useSlotHighlight()
  return on && !isUsed(slot)
}

/**
 * How a slot's part of the stage is marked: lightly with Highlight slots when it is used (an unused
 * one has its placeholder instead), strongly while its row is hovered.
 */
export const useSlotMarks = (slot: string) => {
  const highlight = useSlotHighlight()
  const hovered = highlight.hovered === slot
  const marked = highlight.on && isUsed(slot)
  return {
    marked,
    hovered,
    className: `${marked ? ' marked' : ''}${hovered ? ' hovered' : ''}`,
  }
}

/** "+ label" where an unused slot's contributions would go, with Highlight slots on. */
export const Placeholder = ({ slot, label }: { slot: string; label?: string }) => {
  const { hovered } = useSlotHighlight()
  const shown = usePlaceholderShown(slot)
  if (!shown) return null
  const active = hovered === slot
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
  children,
}: {
  slot: string
  /** its key, when it is one contribution */
  contribution?: string
  children: ReactNode
}) => {
  const { className } = useSlotMarks(slot)
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

/** What the shell gives the SDK (`provideHost({ devSlots })`). */
export const devSlots: DevSlots = {
  Outlet,
  Item,
  // AYON's menu tagging (slotHighlight): the placeholder only while slots are highlighted
  menuPlaceholder: (slot) => slotPlaceholder(slot, slotInfo(slot).label) as SlotMenuItem | undefined,
  menuItem: slotEntry,
  // when the menu opens; after it, in case a scene builds its items while rendering
  menuBuilt: (slot, context) => queueMicrotask(() => reportMenu(slot, context as Record<string, unknown>)),
}
