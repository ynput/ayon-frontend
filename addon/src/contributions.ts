import type { SlotMap, SlotName } from './slots'

/** What an addon writes for a contribution to slot `S`: the slot, its description and pieces. */
export type ContributionInput<S extends SlotName = SlotName> = S extends SlotName
  ? { slot: S } & SlotMap[S]['meta'] & SlotMap[S]['pieces']
  : never

/** The addon a contribution came from. */
export interface AddonInfo {
  /** addon name, as on the server */
  name: string
  version: string
  /** federation remote the manifest was loaded from */
  remote: string
}

/** A contribution as the host keeps it: what the addon wrote, plus where it came from. */
export type Contribution<S extends SlotName = SlotName> = ContributionInput<S> & {
  /** `<addonName>.<id>`, unique across addons */
  key: string
  addon: AddonInfo
}

/** Any contribution, whatever its slot: what the host's generic code (loading, errors) uses. */
export interface AnyContribution {
  slot: string
  id: string
  key: string
  addon: AddonInfo
  [field: string]: unknown
}

/** The default export of an addon's `manifest` module. */
export interface AddonManifest {
  contributes: ContributionInput[]
}

/**
 * Declares what an addon contributes. The default export of the addon's `manifest` module:
 *
 * ```ts
 * import { defineAddon, studioPage } from '@ynput/ayon-addon/manifest'
 * export default defineAddon({ contributes: [studioPage({ ... })] })
 * ```
 *
 * The host loads the manifest at startup, so keep it to descriptions: put components in the
 * pieces (`component: () => import('./Page')`), never import them statically here.
 */
export const defineAddon = (manifest: AddonManifest): AddonManifest => manifest

/** A contribution to any slot by name. The named helpers (`studioPage`, ...) are shorthands. */
export const contribute = <S extends SlotName>(
  slot: S,
  contribution: SlotMap[S]['meta'] & SlotMap[S]['pieces'],
): ContributionInput<S> => ({ ...(contribution as object), slot }) as ContributionInput<S>
