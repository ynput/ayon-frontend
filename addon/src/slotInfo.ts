// What a slot is, for people: its title, where it shows and who declared it. The slot inspector's
// card (developer mode) and the dev shell show it.
import type { AddonInfo } from './contributions'
import { getRegistry } from './registry'
import { SLOT_DOCS } from './slotDocs'
import type { SlotName } from './slots'

export interface SlotInfo {
  slot: string
  /** the declaration's `label`, else the name after the last dot in words */
  label: string
  /** where it shows: the declaration's `description`, or AYON's docs for AYON's slots */
  description?: string
  /** the addon that declared it; none for AYON's own slots */
  owner?: AddonInfo
}

/** A slot name's last part in words: `example.cardMenuItem` is "Card menu item". */
export const slotNameInWords = (name: string) => {
  const words = name
    .slice(name.lastIndexOf('.') + 1)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    .replace(/_+/g, ' ')
    .trim()
    .toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** What a slot is: AYON's (SLOT_DOCS) or one an addon declared (the registry's). */
export const slotInfo = (slot: string): SlotInfo => {
  const declared = getRegistry().slots.find((s) => s.name === slot)
  const label = typeof declared?.label === 'string' && declared.label.trim()
  return {
    slot,
    label: label || slotNameInWords(slot),
    description: declared?.description || SLOT_DOCS[slot as SlotName]?.where,
    owner: declared?.owner,
  }
}
