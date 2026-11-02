// The contributions of every loaded addon manifest. A module-level store, so the host, its shared
// components and (standalone) the dev shell all read the same one; React reads it through
// useSyncExternalStore.
import { useSyncExternalStore } from 'react'
import type { AddonInfo, AnyContribution, Contribution } from './contributions'
import type { SlotName } from './slots'
import { checkManifest, formatSkipped } from './validate'
import type { SkippedContribution } from './validate'

interface RegistryState {
  contributions: AnyContribution[]
  skipped: SkippedContribution[]
  addons: AddonInfo[]
  /** true until the host has loaded every manifest it knows of */
  isLoading: boolean
}

let state: RegistryState = { contributions: [], skipped: [], addons: [], isLoading: true }
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

/**
 * Registers the contributions of one addon's manifest, replacing what that addon registered
 * before. Contributions the host can't use are skipped with a console warning naming them.
 */
export const registerManifest = (addon: AddonInfo, manifest: unknown) => {
  const result = checkManifest(addon, manifest)
  result.skipped.forEach((skipped) => console.warn(formatSkipped(skipped)))

  setState({
    contributions: [
      ...state.contributions.filter((c) => c.addon.name !== addon.name),
      ...result.contributions,
    ],
    skipped: [...state.skipped.filter((s) => s.addon !== addon.name), ...result.skipped],
    addons: [...state.addons.filter((a) => a.name !== addon.name), addon],
  })
  return result
}

/** Removes everything an addon registered. */
export const unregisterAddon = (addonName: string) =>
  setState({
    contributions: state.contributions.filter((c) => c.addon.name !== addonName),
    skipped: state.skipped.filter((s) => s.addon !== addonName),
    addons: state.addons.filter((a) => a.name !== addonName),
  })

/** The host calls this once every manifest it knows of has loaded (or failed). */
export const setManifestsLoading = (isLoading: boolean) => {
  if (state.isLoading !== isLoading) setState({ isLoading })
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
