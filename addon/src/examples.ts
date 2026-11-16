// The example contributions AYON adds with Show slots on: one per slot, owned by the slot's owner
// (`ayon` for AYON's slots, the declaring addon for the others), after the slot's real ones. Loaded
// by the registry when the mode first turns on.
import type { AddonInfo, AnyContribution } from './contributions'
import { SLOTS } from './slots'
import type { SlotDefinition, SlotExample, SlotName } from './slots'
import { exampleFields, SLOT_EXAMPLES } from './slotExamples'
import { checkManifest, formatSkipped } from './validate'
import type { DeclaredSlot } from './validate'

/** The owner of the examples of AYON's own slots. */
export const AYON_OWNER: AddonInfo = { name: 'ayon', version: '', remote: '' }

/** An example's id: unique across the slots of one owner. */
export const exampleId = (slot: string) => `example_${slot.replace(/[^A-Za-z0-9]+/g, '_')}`

// after every real contribution of slots that order theirs
const LAST = Number.MAX_SAFE_INTEGER

// the item built for each slot's example, kept while the example is the same object, so the
// contribution built from it is too (`built`): an unchanged example doesn't re-render
const items = new Map<string, { example: SlotExample | undefined; version: number; item: object }>()
const built = new WeakMap<object, AnyContribution>()
const warned = new Set<string>()

const exampleItem = (slot: string, definition: SlotDefinition & { label?: string }, example?: SlotExample) => {
  const cached = items.get(slot)
  if (cached && cached.example === example && cached.version === definition.version) return cached.item
  const item = {
    ...exampleFields({ ...definition, example }),
    id: exampleId(slot),
    slot,
    slotVersion: definition.version,
    order: LAST,
    example: true,
  }
  items.set(slot, { example, version: definition.version, item })
  return item
}

/**
 * The example contribution of every slot: AYON's and the declared ones. One that its slot's rules
 * skip (a declared slot's example without the fields its check needs) is left out with a console
 * warning.
 */
export const buildExamples = (declared: readonly DeclaredSlot[]): AnyContribution[] => {
  const slots: Record<string, SlotDefinition> = { ...SLOTS }
  const owners = new Map<string, { addon: AddonInfo; contributes: object[] }>()
  const add = (addon: AddonInfo, slot: string, definition: SlotDefinition, example?: SlotExample) => {
    const owner = owners.get(addon.name) ?? { addon, contributes: [] }
    owner.contributes.push(exampleItem(slot, definition, example))
    owners.set(addon.name, owner)
  }
  for (const slot of Object.keys(SLOTS) as SlotName[]) add(AYON_OWNER, slot, SLOTS[slot], SLOT_EXAMPLES[slot])
  for (const slot of declared) {
    slots[slot.name] = slot
    add(slot.owner, slot.name, slot, slot.example)
  }

  const contributions: AnyContribution[] = []
  for (const { addon, contributes } of owners.values()) {
    const result = checkManifest(addon, { contributes }, slots, built)
    contributions.push(...result.contributions)
    for (const skipped of result.skipped) {
      const line = `[slot example] ${formatSkipped(skipped)}`
      if (!warned.has(line)) console.warn(line)
      warned.add(line)
    }
  }
  return contributions
}
