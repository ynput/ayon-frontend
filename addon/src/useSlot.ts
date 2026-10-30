import { useContext } from 'react'
import type { SlotContext, SlotName } from './slots'
import { SlotReactContext } from './SlotContextInstance'

const list = (slots: readonly string[]) =>
  slots.length === 1 ? `'${slots[0]}'` : `[${slots.map((s) => `'${s}'`).join(', ')}]`

/**
 * The context of the slot this component is rendered in. Name the slot explicitly; a component
 * used in several slots lists them all and checks `ctx.slot` for fields not every slot has:
 *
 * ```ts
 * const { projectName } = useSlot('project.page')
 * const ctx = useSlot(['project.page', 'detailsPanel.tab'])
 * ```
 *
 * Throws when rendered outside those slots. The top-level component of a contribution gets the
 * same context as props.
 */
export function useSlot<S extends SlotName>(slot: S | readonly S[]): SlotContext<S> {
  const active = useContext(SlotReactContext)
  const slots: readonly string[] = Array.isArray(slot) ? slot : [slot as unknown as string]

  if (!active) {
    throw new Error(
      `useSlot(${list(slots)}) was called outside any addon slot. ` +
        `Call it in a component rendered by a ${list(slots)} contribution.`,
    )
  }
  if (!slots.includes(active.slot)) {
    throw new Error(
      `useSlot(${list(slots)}) was called in a component rendered in slot '${active.slot}' ` +
        `(${active.contribution.key}). Name every slot the component is used in: ` +
        `useSlot([${[...slots, active.slot].map((s) => `'${s}'`).join(', ')}]).`,
    )
  }
  return active.value as SlotContext<S>
}
