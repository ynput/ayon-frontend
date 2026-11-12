// What the shell knows about the slots on its stage, for the slots rendered with the SDK's SlotOutlet
// and useSlotMenuItems (preview scenes, the addon's own slots) and the shell's own stand-ins for
// AYON's. The shell hands `devSlots` to the SDK as the host's (internal, never set by AYON), so
// scenes need no code for it: each slot reports the context it passes, which the Context panel
// shows. What marks slots on stage is AYON's slot inspector (`slotInspector` in the shared
// package): Show slots adds every slot's example, Highlight contributions outlines them.
import { getRegistry } from '@ynput/ayon-addon/host'
import type { DevSlots } from '@ynput/ayon-addon/host'
import type { SlotName } from '@ynput/ayon-addon'
import { SLOT_DOCS } from '@ynput/ayon-addon/check'
import { slotLabel } from './contractModel'
import { reportMenu, useSlotReport } from './status'

/** A slot's title and where it shows: its declaration's, or AYON's docs for AYON's slots. */
export const slotInfo = (slot: string) => {
  const declared = getRegistry().slots.find((s) => s.name === slot)
  return {
    label: slotLabel(slot, declared?.label),
    description: declared?.description || SLOT_DOCS[slot as SlotName]?.where,
  }
}

const NO_CONTEXT = {}

/** What the shell gives the SDK (`provideHost({ devSlots })`). */
export const devSlots: DevSlots = {
  // what the slot passes, also with no contributions yet: Context shows it
  useOutletReport: (slot, context) => useSlotReport(slot, (context as object | undefined) ?? NO_CONTEXT),
  // when the menu opens; after it, in case a scene builds its items while rendering
  menuBuilt: (slot, context) => queueMicrotask(() => reportMenu(slot, context as Record<string, unknown>)),
}
