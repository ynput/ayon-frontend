// The places of this shell: AYON's slots (the SDK's), the contract packages' scenes and the slots
// the addon declares itself (places.ts), built once the manifests are registered.
import { getRegistry, isExample } from '@ynput/ayon-addon/host'
import { SLOT_DOCS, SLOTS } from '@ynput/ayon-addon/check'
import type { AnyContribution, SlotName } from '@ynput/ayon-addon'
import { getContracts } from './contractModel'
import { buildPlaces, manifestSnippet, OTHER_PLACE, usedSlots } from './places'
import type { Place } from './places'

let cached: { contracts: unknown; slots: unknown; places: Place[] } | undefined

/** Every place, in the panel's order ("Other slots" last). */
export const getPlaces = (): Place[] => {
  const { slots } = getRegistry()
  const contracts = getContracts()
  if (cached && cached.contracts === contracts && cached.slots === slots) return cached.places
  const contractSlots = new Set(contracts.flatMap((c) => c.slots.map((s) => s.name)))
  const places = buildPlaces({
    ayonSlots: Object.keys(SLOTS),
    ayonDescriptions: Object.fromEntries(Object.entries(SLOT_DOCS).map(([slot, doc]) => [slot, doc.where])),
    contracts,
    declared: slots.filter((slot) => !contractSlots.has(slot.name)),
  })
  cached = { contracts, slots, places }
  return places
}

export const getPlace = (id?: string) => (id ? getPlaces().find((place) => place.id === id) : undefined)

export const idOf = (contribution: AnyContribution) => (contribution as { id: string }).id

/** The addon's own contributions, without the slots' examples (Show slots). */
const ownContributions = () => getRegistry().contributions.filter((c) => !isExample(c))

/** This addon's contributions to a slot: what makes it "used". */
export const contributionsTo = (slot?: string) => (slot ? ownContributions().filter((c) => c.slot === slot) : [])

/** What a slot shows on stage: the addon's contributions, then its example with Show slots on. */
export const onStage = (slot: string) => getRegistry().contributions.filter((c) => c.slot === slot)

export const getUsedSlots = () => usedSlots(ownContributions())

/** The contribution in focus, if the selection names one. */
export const findContribution = (slot?: string, id?: string) =>
  slot && id ? getRegistry().contributions.find((c) => c.slot === slot && idOf(c) === id) : undefined

/** A slot's declaration as the host checks it: AYON's (SLOTS), else the declaring addon's. */
export const slotDeclaration = (slot: string) =>
  slot in SLOTS
    ? { name: slot, ...SLOTS[slot as SlotName] }
    : getRegistry().slots.find((s) => s.name === slot)

/** The manifest entry to start a contribution to a slot with, from its declaration. */
export const slotSnippet = (slot: string) => {
  const declaration = slotDeclaration(slot)
  if (!declaration) return undefined
  return manifestSnippet(declaration, SLOT_DOCS[slot as SlotName]?.helper)
}

export { OTHER_PLACE }
