// The contributions of every loaded addon manifest. A module-level store, so the host, its shared
// components and (standalone) the dev shell all read the same one; React reads it through
// useSyncExternalStore.
import { useSyncExternalStore } from 'react'
import type { AddonInfo, AnyContribution, Contribution } from './contributions'
import { SLOTS } from './slots'
import type { SlotName } from './slots'
import {
  checkManifest,
  checkSlotDeclarations,
  formatSkipped,
  formatSkippedDeclaration,
} from './validate'
import type { DeclaredSlot, SkippedContribution, SkippedDeclaration } from './validate'

/** An addon and the default export of its manifest module. */
export interface ManifestEntry {
  addon: AddonInfo
  manifest: unknown
}

interface RegistryState {
  contributions: AnyContribution[]
  skipped: SkippedContribution[]
  addons: AddonInfo[]
  /** the slots addons declared, each with its owner */
  slots: DeclaredSlot[]
  skippedSlots: SkippedDeclaration[]
  /** true until the host has loaded every manifest it knows of */
  isLoading: boolean
}

let state: RegistryState = {
  contributions: [],
  skipped: [],
  addons: [],
  slots: [],
  skippedSlots: [],
  isLoading: true,
}
// every manifest registered so far: the registry is computed from all of them, because a change to
// one addon's declarations changes which contributions of the others apply
let manifests: ManifestEntry[] = []
// the skipped contributions already in the console
let warnedSkipped: SkippedContribution[] = []
const listeners = new Set<() => void>()
// per-slot snapshots, rebuilt lazily after each change (useSyncExternalStore needs stable values)
let slotSnapshots = new Map<string, { contributions: AnyContribution[]; isLoading: boolean }>()

const setState = (next: Partial<RegistryState>) => {
  state = { ...state, ...next }
  slotSnapshots = new Map()
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const warnNew = <T>(previous: readonly T[], next: readonly T[], format: (item: T) => string) => {
  const known = new Set(previous.map(format))
  next.forEach((item) => {
    const line = format(item)
    if (!known.has(line)) console.warn(line)
  })
}

const isKnownSlot = (slot: string) =>
  Object.prototype.hasOwnProperty.call(SLOTS, slot) || state.slots.some((s) => s.name === slot)

// While manifests load, a contribution to an addon's slot nobody has declared may just have arrived
// first: its warning waits until every manifest is in.
const warnSkipped = () => {
  const definite = state.skipped.filter(
    ({ slot }) => !state.isLoading || !slot?.includes('.') || isKnownSlot(slot),
  )
  warnNew(warnedSkipped, definite, formatSkipped)
  warnedSkipped = definite
}

// Two phases, so the result doesn't depend on the order the manifests came in: every declaration
// first, then every contribution against AYON's slots plus the declared ones.
const applyManifests = (next: ManifestEntry[]) => {
  manifests = next
  const slots: DeclaredSlot[] = []
  const skippedSlots: SkippedDeclaration[] = []
  for (const { addon, manifest } of next) {
    const result = checkSlotDeclarations(addon, manifest, slots)
    slots.push(...result.slots)
    skippedSlots.push(...result.skipped)
  }

  const available = { ...SLOTS, ...Object.fromEntries(slots.map((slot) => [slot.name, slot])) }
  const contributions: AnyContribution[] = []
  const skipped: SkippedContribution[] = []
  for (const { addon, manifest } of next) {
    const result = checkManifest(addon, manifest, available)
    contributions.push(...result.contributions)
    skipped.push(...result.skipped)
  }

  warnNew(state.skippedSlots, skippedSlots, formatSkippedDeclaration)
  const addons = new Map(next.map(({ addon }) => [addon.name, addon]))
  setState({ contributions, skipped, slots, skippedSlots, addons: [...addons.values()] })
  warnSkipped()
}

/**
 * Registers the manifests of several addons at once, replacing what those addons registered
 * before. What the host can't use is skipped with a console warning naming it. The host calls this
 * each time a manifest arrives, with everything loaded so far in a fixed order.
 */
export const registerManifests = (entries: readonly ManifestEntry[]) => {
  const names = new Set(entries.map(({ addon }) => addon.name))
  applyManifests([...manifests.filter(({ addon }) => !names.has(addon.name)), ...entries])
}

/** Registers one addon's manifest, replacing what that addon registered before. */
export const registerManifest = (addon: AddonInfo, manifest: unknown) => {
  registerManifests([{ addon, manifest }])
  return {
    contributions: state.contributions.filter((c) => c.addon.name === addon.name),
    skipped: state.skipped.filter((s) => s.addon === addon.name),
  }
}

/** Removes everything an addon registered. */
export const unregisterAddon = (addonName: string) =>
  applyManifests(manifests.filter(({ addon }) => addon.name !== addonName))

/** The host calls this once every manifest it knows of has loaded (or failed). */
export const setManifestsLoading = (isLoading: boolean) => {
  if (state.isLoading === isLoading) return
  setState({ isLoading })
  warnSkipped()
}

/** Everything registered, for tooling (developer panel, `ayon-addon check`). */
export const getRegistry = (): Readonly<RegistryState> => state

export interface ContributionsResult<S extends SlotName> {
  /** contributions to the slot, in manifest order, addons in load order */
  contributions: Contribution<S>[]
  /** true while the host is still loading manifests: more contributions may come */
  isLoading: boolean
}

/** The contributions to one slot. Not filtered: the surface decides which apply. */
export const getContributions = <S extends SlotName>(slot: S): ContributionsResult<S> => {
  let snapshot = slotSnapshots.get(slot)
  if (!snapshot) {
    snapshot = {
      contributions: state.contributions.filter((c) => c.slot === slot),
      isLoading: state.isLoading,
    }
    slotSnapshots.set(slot, snapshot)
  }
  return snapshot as unknown as ContributionsResult<S>
}

/**
 * The contributions to one slot, updated as manifests load.
 *
 * ```ts
 * const { contributions, isLoading } = useContributions('studio.page')
 * ```
 */
export const useContributions = <S extends SlotName>(slot: S): ContributionsResult<S> =>
  useSyncExternalStore(
    subscribe,
    () => getContributions(slot),
    () => getContributions(slot),
  )
