import type { SlotDeclaration, SlotMap, SlotName } from './slots'

/** The description fields every slot has, whatever its own. */
export interface CommonMeta {
  /** unique within the slot: a letter, then letters, digits and `_` */
  id: string
  /**
   * Hides the contribution from users whose UI exposure level is lower, e.g. `EXPOSURE.manager`
   * (700): managers and admins see it. AYON hides it before loading any of its code. It only hides
   * UI: the addon's server must still check permissions
   */
  minExposureLevel?: number
}

/**
 * The fields of a contribution to slot `S`: its `id` and `minExposureLevel` (every slot has them,
 * so a slot's `meta` needn't repeat them), its description and its pieces.
 */
export type ContributionFields<S extends SlotName> = CommonMeta & SlotMap[S]['meta'] &
  SlotMap[S]['pieces']

/** What an addon writes for a contribution to slot `S`: the slot, its description and pieces. */
export type ContributionInput<S extends SlotName = SlotName> = S extends SlotName
  ? { slot: S; slotVersion?: number } & ContributionFields<S>
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
  /** slots of this addon that other addons can contribute to */
  slots?: readonly SlotDeclaration[]
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

/**
 * A contribution to any slot by name. The named helpers (`studioPage`, ...) are shorthands. To an
 * addon's slot at a version other than 1, pass the `slotVersion` it was built for (a contract
 * package's helper does it).
 */
export const contribute = <S extends SlotName>(
  slot: S,
  contribution: ContributionFields<S> & { slotVersion?: number },
): ContributionInput<S> => ({ ...(contribution as object), slot }) as ContributionInput<S>
