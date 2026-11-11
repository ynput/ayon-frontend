// "Show slots": where each slot sits on the stage, for the slots rendered with the SDK's
// SlotOutlet and useSlotMenuItems (preview scenes, the addon's own slots). The shell hands this to
// the SDK as the host's `devSlots` (internal, never set by AYON), so scenes need no code for it:
// a slot with contributions gets a dashed outline around each of them, one without gets a small
// placeholder chip where they would go, and an empty menu slot one disabled entry. Hovering a
// slot here or in the developer panel highlights it in both.
import { useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { getRegistry } from '@ynput/ayon-addon/host'
import type { DevSlotOutletProps, DevSlots } from '@ynput/ayon-addon/host'
import type { SlotMenuItem, SlotName } from '@ynput/ayon-addon'
import { SLOT_DOCS } from '@ynput/ayon-addon/check'
import { slotLabel } from './contractModel'

interface SlotOverlay {
  /** the outlines and placeholders are on */
  show: boolean
  /** the slot hovered in the developer panel */
  highlighted?: string
  /** the slot hovered on the stage */
  hovered?: string
}

let state: SlotOverlay = { show: true }
const listeners = new Set<() => void>()
const update = (patch: Partial<SlotOverlay>) => {
  const next = { ...state, ...patch }
  if (next.show === state.show && next.highlighted === state.highlighted && next.hovered === state.hovered) return
  state = next
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
export const setShowSlots = (show: boolean) => update({ show })
/** from the developer panel: the slot to highlight on the stage, or none */
export const highlightSlot = (slot?: string) => update({ highlighted: slot })

/** A slot's title and where it shows: its declaration's, or AYON's docs for AYON's slots. */
export const slotInfo = (slot: string) => {
  const declared = getRegistry().slots.find((s) => s.name === slot)
  return {
    label: slotLabel(slot, declared?.label),
    description: declared?.description || SLOT_DOCS[slot as SlotName]?.where,
  }
}

const unionRect = (elements: HTMLCollection) => {
  const rects = [...elements].map((element) => element.getBoundingClientRect()).filter((r) => r.width || r.height)
  if (!rects.length) return undefined
  return {
    left: Math.min(...rects.map((r) => r.left)),
    top: Math.min(...rects.map((r) => r.top)),
  }
}

const Outlet = ({ slot, count, children }: DevSlotOutletProps) => {
  const overlay = useSlotOverlay()
  const ref = useRef<HTMLSpanElement>(null)
  const [hover, setHover] = useState(false)
  const [labelAt, setLabelAt] = useState<{ left: number; top: number }>()
  const active = overlay.show && (hover || overlay.highlighted === slot)
  // the slot's name above its contributions while it is hovered (the chip of an empty one has it)
  useLayoutEffect(() => {
    setLabelAt(active && count && ref.current ? unionRect(ref.current.children) : undefined)
  }, [active, count])
  if (!overlay.show) return <>{children}</>

  const { label, description } = slotInfo(slot)
  const title = [label, slot, description].filter(Boolean).join('\n')
  const enter = () => {
    setHover(true)
    update({ hovered: slot })
  }
  const leave = () => {
    setHover(false)
    if (state.hovered === slot) update({ hovered: undefined })
  }
  return (
    // display: contents, so the page lays out the contributions as it does without the outline
    <span
      ref={ref}
      className={`ayon-dev-slot${count ? '' : ' empty'}${active ? ' active' : ''}`}
      data-ayon-dev-slot={slot}
      onMouseOver={() => !hover && enter()}
      onMouseOut={(event) => !ref.current?.contains(event.relatedTarget as Node | null) && leave()}
    >
      {count ? (
        children
      ) : (
        <span className="ayon-dev-slot-chip" title={`${title}\nNo contributions`}>
          {label}
        </span>
      )}
      {labelAt &&
        createPortal(
          <span className="ayon-dev-slot-label" style={{ left: labelAt.left, top: labelAt.top }}>
            {label}
          </span>,
          document.body,
        )}
    </span>
  )
}

/** What the shell gives the SDK (`provideHost({ devSlots })`). */
export const devSlots: DevSlots = {
  Outlet,
  menuPlaceholder: (slot) =>
    state.show
      ? ({
          id: `ayon-dev-slot:${slot}`,
          label: `${slotInfo(slot).label} — no contributions`,
          icon: 'extension',
          command: () => undefined,
          disabled: true,
        } as SlotMenuItem)
      : undefined,
}
