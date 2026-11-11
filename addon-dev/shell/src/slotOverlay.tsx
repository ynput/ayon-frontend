// Where slots sit on the stage, for the slots rendered with the SDK's SlotOutlet and
// useSlotMenuItems (preview scenes, the addon's own slots), and the shell's own stand-ins for
// AYON's. The shell hands this to the SDK as the host's `devSlots` (internal, never set by AYON),
// so scenes need no code for it. Filled slots get no decoration: only the focus outline (the
// slot or contribution picked in the developer panel) and an outline with the slot's label while
// its row in "Slots here" is hovered. Unused slots get a "+ label" placeholder where a
// contribution would go, with Show unused slots on (or while focused).
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { runContribution } from '@ynput/ayon-addon'
import { getRegistry } from '@ynput/ayon-addon/host'
import type { DevSlotItemProps, DevSlotOutletProps, DevSlots } from '@ynput/ayon-addon/host'
import type { SlotMenuItem, SlotName } from '@ynput/ayon-addon'
import { SLOT_DOCS } from '@ynput/ayon-addon/check'
import { slotLabel } from './contractModel'
import { setStage } from './status'

interface SlotOverlay {
  showUnused: boolean
  /** the slot in focus */
  focusSlot?: string
  /** the contribution in focus, by key (`<addon>.<id>`) */
  focusKey?: string
  /** the slot whose row is hovered in the developer panel */
  highlighted?: string
  /** the slots with an outlet on the stage now */
  mounted: readonly string[]
  /** the focused contribution, when it is on the stage but renders nothing (its own condition) */
  emptyFocus?: string
}

let state: SlotOverlay = { showUnused: false, mounted: [] }
const listeners = new Set<() => void>()
const update = (patch: Partial<SlotOverlay>) => {
  const next = { ...state, ...patch }
  if ((Object.keys(patch) as (keyof SlotOverlay)[]).every((key) => next[key] === state[key])) return
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
export const setOverlay = (patch: Pick<SlotOverlay, 'showUnused' | 'focusSlot' | 'focusKey'>) => update(patch)
/** from the developer panel: the slot whose row is hovered, or none */
export const highlightSlot = (slot?: string) => update({ highlighted: slot })

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

const PLACEHOLDER_TIP = 'Your contribution would appear here.'

/** Whether a slot shows its placeholder: unused, with Show unused slots on or while focused. */
export const usePlaceholderShown = (slot: string) => {
  const overlay = useSlotOverlay()
  return !isUsed(slot) && (overlay.showUnused || overlay.focusSlot === slot)
}

/** "+ label" where an unused slot's contributions would go; nothing for a used slot. */
export const Placeholder = ({ slot, label }: { slot: string; label?: string }) => {
  const overlay = useSlotOverlay()
  const shown = usePlaceholderShown(slot)
  if (!shown) return null
  const active = overlay.focusSlot === slot || overlay.highlighted === slot
  return (
    <span className={`ayon-dev-slot${active ? ' active' : ''}`} data-ayon-dev-slot={slot}>
      <span className="ayon-dev-slot-chip" title={PLACEHOLDER_TIP}>
        + {label || slotInfo(slot).label}
      </span>
    </span>
  )
}

const firstRect = (element: HTMLElement | null) => {
  const rects = [...(element?.children || [])]
    .map((child) => child.getBoundingClientRect())
    .filter((r) => r.width || r.height)
  if (!rects.length) return undefined
  return { left: Math.min(...rects.map((r) => r.left)), top: Math.min(...rects.map((r) => r.top)) }
}

/**
 * One contribution on the stage, outlined while it (or its slot) is in focus or its slot's row is
 * hovered. Display: contents, so the page lays it out as it does without the shell.
 */
export const FocusFrame = ({
  slot,
  contribution,
  label,
  children,
}: {
  slot: string
  /** its key; without one, the frame is the slot's */
  contribution?: string
  /** shown above it while its row is hovered */
  label?: string
  children: ReactNode
}) => {
  const overlay = useSlotOverlay()
  const ref = useRef<HTMLSpanElement>(null)
  const focused = contribution
    ? overlay.focusKey === contribution
    : overlay.focusSlot === slot && !overlay.focusKey
  const slotFocused = overlay.focusSlot === slot && !overlay.focusKey
  const hovered = overlay.highlighted === slot
  const [labelAt, setLabelAt] = useState<{ left: number; top: number }>()
  useLayoutEffect(() => setLabelAt(hovered ? firstRect(ref.current) : undefined), [hovered])
  // a focused contribution that renders nothing: the stage header says so
  useLayoutEffect(() => {
    const element = ref.current
    if (!contribution || !focused || !element) return
    const check = () => {
      const empty = !element.childNodes.length
      if (empty) update({ emptyFocus: contribution })
      else if (state.emptyFocus === contribution) update({ emptyFocus: undefined })
    }
    check()
    const observer = new MutationObserver(check)
    observer.observe(element, { childList: true })
    return () => {
      observer.disconnect()
      if (state.emptyFocus === contribution) update({ emptyFocus: undefined })
    }
  }, [contribution, focused])
  return (
    <span
      ref={ref}
      className={`ayon-dev-item${focused || slotFocused ? ' focused' : ''}${hovered ? ' hovered' : ''}`}
      data-ayon-dev-slot={slot}
      data-ayon-dev-contribution={contribution}
    >
      {children}
      {labelAt &&
        createPortal(
          <span className="ayon-dev-slot-label" style={{ left: labelAt.left, top: labelAt.top }}>
            {label || slotInfo(slot).label}
          </span>,
          document.body,
        )}
    </span>
  )
}

const contributionByKey = (key: string) => getRegistry().contributions.find((c) => c.key === key)

/** The focused contribution of a scene reports the context its slot passes it. */
const reportContext = (key: string, context: unknown) => {
  const contribution = contributionByKey(key)
  const run = (contribution as { run?: unknown } | undefined)?.run
  setStage({
    context: context as Record<string, unknown>,
    ready: true,
    run: run && contribution ? () => runContribution(contribution as never, context as never) : undefined,
  })
}

const Outlet = ({ slot, count, children }: DevSlotOutletProps) => {
  useEffect(() => {
    mount(slot)
    return () => unmount(slot)
  }, [slot])
  return count ? <>{children}</> : <Placeholder slot={slot} />
}

const Item = ({ slot, contribution, context, children }: DevSlotItemProps) => {
  const { focusKey } = useSlotOverlay()
  useEffect(() => {
    // after the stage's own report of this render (SceneStage)
    if (focusKey === contribution) queueMicrotask(() => reportContext(contribution, context))
  }, [focusKey, contribution, context])
  return (
    <FocusFrame slot={slot} contribution={contribution}>
      {children}
    </FocusFrame>
  )
}

/** What the shell gives the SDK (`provideHost({ devSlots })`). */
export const devSlots: DevSlots = {
  Outlet,
  Item,
  menuPlaceholder: (slot) =>
    !isUsed(slot) && (state.showUnused || state.focusSlot === slot)
      ? ({
          id: `ayon-dev-slot:${slot}`,
          label: `+ ${slotInfo(slot).label}`,
          icon: 'add',
          command: () => undefined,
          disabled: true,
        } as SlotMenuItem)
      : undefined,
  // when the menu opens; after it, in case a scene builds its items while rendering
  menuBuilt: (_slot, context, contributions) => {
    const key = state.focusKey
    if (key && contributions.includes(key)) queueMicrotask(() => reportContext(key, context))
  },
}
