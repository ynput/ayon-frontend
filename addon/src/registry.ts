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
  slotNameOwner,
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
  /** Show slots is on: `contributions` ends with each slot's example (`example: true`) */
  examples: boolean
  /** a switch of the slot inspector is on: rendered contributions carry `contributionTags` */
  tagged: boolean
  /** the slot inspector is available: `ContributionView` keeps a wrapper for the tags */
  wrapped: boolean
}

let state: RegistryState = {
  contributions: [],
  skipped: [],
  addons: [],
  slots: [],
  skippedSlots: [],
  isLoading: true,
  examples: false,
  tagged: false,
  wrapped: false,
}
// every manifest registered so far: the registry is computed from all of them, because a change to
// one addon's declarations changes which contributions of the others apply
let manifests: ManifestEntry[] = []
// the contribution built from each manifest item, so re-checking every manifest when another one
// arrives keeps the objects of unchanged contributions (useSlot, ContributionView depend on them)
const built = new WeakMap<object, AnyContribution>()
// the skipped contributions already in the console
let warnedSkipped: SkippedContribution[] = []
const listeners = new Set<() => void>()
// the example builder, loaded when Show slots first turns on
let examples: typeof import('./examples') | undefined
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

/** Calls the listener after every change of the registry (`getRegistry`). */
export const subscribeRegistry = subscribe

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
// first: its warning waits until every manifest is in. A name under AYON's prefixes can't be
// declared later, so that one warns at once.
const warnSkipped = () => {
  const definite = state.skipped.filter(
    ({ slot }) => !state.isLoading || !slot || !slotNameOwner(slot) || isKnownSlot(slot),
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
    const result = checkManifest(addon, manifest, available, built)
    contributions.push(...result.contributions)
    skipped.push(...result.skipped)
  }
  // each slot's example after its real contributions: surfaces list a slot's in registry order
  if (state.examples && examples) contributions.push(...examples.buildExamples(slots))

  warnNew(state.skippedSlots, skippedSlots, formatSkippedDeclaration)
  const addons = new Map(next.map(({ addon }) => [addon.name, addon]))
  setState({ contributions, skipped, slots, skippedSlots, addons: [...addons.values()] })
  warnSkipped()
}

/**
 * Registers the manifests of several addons at once, replacing what those addons registered
 * before. What the host can't use is skipped with a console warning naming it. The host calls this
 * each time a manifest arrives, with everything loaded so far in a fixed order. Two entries of one
 * addon (two of its remotes expose a manifest): the later one replaces the earlier.
 */
export const registerManifests = (entries: readonly ManifestEntry[]) => {
  const latest = [...new Map(entries.map((entry) => [entry.addon.name, entry])).values()]
  const names = new Set(latest.map(({ addon }) => addon.name))
  applyManifests([...manifests.filter(({ addon }) => !names.has(addon.name)), ...latest])
}

/** Registers one addon's manifest, replacing what that addon registered before. */
export const registerManifest = (addon: AddonInfo, manifest: unknown) => {
  registerManifests([{ addon, manifest }])
  return {
    contributions: state.contributions.filter((c) => c.addon.name === addon.name && !isExample(c)),
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

/**
 * Show slots: adds the example contribution of every slot, AYON's and the declared ones, each
 * owned by its slot's owner (`ayon` for AYON's). Their code loads when this first turns them on.
 */
export const setSlotExamples = (on: boolean) => {
  if (state.examples === on) return
  state = { ...state, examples: on }
  if (!on || examples) {
    applyManifests(manifests)
    return
  }
  import('./examples').then(
    (module) => {
      examples = module
      if (state.examples) applyManifests(manifests)
    },
    (error) => console.error('could not load the slot examples', error),
  )
}

/** Internal, for tests (Node can't load the sources' dynamic imports): the example builder, loaded. */
export const provideExamples = (module: typeof import('./examples')) => {
  examples = module
}

/** Whether a contribution is a slot's example (Show slots), not an addon's. */
export const isExample = (contribution: object) => (contribution as { example?: unknown }).example === true

/** The attributes that tag a rendered contribution for the slot inspector. */
export interface ContributionTags {
  'data-ayon-addon': string
  'data-ayon-slot': string
  'data-ayon-contribution': string
}

/**
 * Tags rendered contributions (`contributionTags`) while the slot inspector needs them; without
 * it, AYON's DOM has none.
 */
export const setContributionTags = (on: boolean) => {
  if (state.tagged !== on) setState({ tagged: on })
}

/** The attributes of an element that shows a contribution, or nothing when tags are off. */
export const contributionTags = (contribution: {
  addon: { name: string }
  slot: string
  key: string
}): ContributionTags | undefined =>
  state.tagged
    ? {
        'data-ayon-addon': contribution.addon.name,
        'data-ayon-slot': contribution.slot,
        'data-ayon-contribution': contribution.key,
      }
    : undefined

const getTagged = () => state.tagged

/** Whether rendered contributions are tagged; re-renders when it changes. */
export const useContributionTagging = () => useSyncExternalStore(subscribe, getTagged, getTagged)

/**
 * Keeps the `display: contents` element `ContributionView` puts the tags on, with or without
 * them, while the slot inspector is available: turning the tags on and off then changes
 * attributes only, and contributions keep their state. Without it, AYON's DOM has no wrappers.
 */
export const setContributionWrappers = (on: boolean) => {
  if (state.wrapped !== on) setState({ wrapped: on })
}

const getWrapped = () => state.wrapped

/** Whether `ContributionView` wraps contributions; re-renders when it changes. */
export const useContributionWrappers = () => useSyncExternalStore(subscribe, getWrapped, getWrapped)

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
