// What the shell knows about the slots on its stage, for the slots rendered with the SDK's SlotOutlet
// and useSlotMenuItems (preview scenes, the addon's own slots) and the shell's own stand-ins for
// AYON's. The shell hands `devSlots` to the SDK as the host's (internal, never set by AYON), so
// scenes need no code for it: each slot reports the context it passes, which the Context panel
// shows. What marks slots on stage is AYON's slot inspector (`slotInspector` in the shared
// package): Show slots adds every slot's example and outlines every contribution.
import type { DevSlots } from '@ynput/ayon-addon/host'
import { reportMenu, useSlotReport } from './status'

const NO_CONTEXT = {}

/** What the shell gives the SDK (`provideHost({ devSlots })`). */
export const devSlots: DevSlots = {
  // what the slot passes, also with no contributions yet: Context shows it
  useOutletReport: (slot, context) => useSlotReport(slot, (context as object | undefined) ?? NO_CONTEXT),
  // when the menu opens; after it, in case a scene builds its items while rendering
  menuBuilt: (slot, context) => queueMicrotask(() => reportMenu(slot, context as Record<string, unknown>)),
}
