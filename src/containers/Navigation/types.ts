import type { contributionTags } from '@ynput/ayon-addon/host'
import type { NavLinkItem } from '@containers/header/AppNavLinks'

/** The slot inspector's `data-` attributes for a contribution, while the inspector is on. */
export type InspectorTags = ReturnType<typeof contributionTags>

/** A context's sidebar sections, in the order the sidebar shows them. */
export const NAV_SECTIONS = ['main', 'review', 'plan', 'pipeline', 'other', 'admin'] as const
export type NavSection = (typeof NAV_SECTIONS)[number]

/**
 * A sidebar item: one place in a context (a project or Home), with the tabs the tab row shows
 * while it is selected. Built by the navigation registry, the only source of navigation items.
 */
export interface NavItem {
  /**
   * Stable across renders, projects and addon versions, for layouts to refer to:
   * a core module key (`production`, `reviews`), `addon:<addon>/<page id>` for an addon page,
   * `group:<addon>/<group>` for an addon's grouped pages, `classic:<addon>` for an iframe addon.
   */
  id: string
  label: string
  /** a Material Symbols name */
  icon: string
  section: NavSection
  /** within the section, lower first; items without one keep the registry order */
  order?: number
  /** the tab row while the item is selected; the first tab the user can open is its landing */
  tabs: NavLinkItem[]
  /** the tab (module) the item opens on, when not its first */
  landing?: string
  /**
   * Other paths the item is selected on: pages with their own tab row (the Project manager), by
   * path prefix
   */
  match?: string[]
  /** the slot inspector's tags, spread on the item like on a tab */
  tags?: InspectorTags
  /**
   * Shown but not usable yet, so the sidebar keeps a place another context has: why, as its
   * tooltip. It has no tabs and opens nothing.
   */
  disabled?: string
  /** disabled because its addon needs a licence: a bolt marks it */
  needsLicense?: boolean
}

/** Why an addon isn't usable here: its places' tooltip, and whether a licence is what's missing. */
export interface AddonUnavailable {
  reason: string
  needsLicense?: boolean
}

/** What the user can open: the `accessLevels` a tab may require. */
export type NavAccess = Record<string, boolean>

/**
 * An arrangement of the registry: which items and tabs show, in what order (`arrange.ts`). An
 * addon's module hands it over (`NavArrangement`); without one nothing is arranged.
 */
export interface NavLayout {
  /** item ids not shown */
  hidden?: string[]
  /**
   * item ids in this order within their section, the others following in registry order; with
   * `free`, the whole sidebar: items and dividers (`divider:<id>`) in this order, wherever their
   * sections are
   */
  order?: string[]
  /** the user arranged the sidebar (`order`): its sections no longer apply */
  free?: boolean
  /** each item's tab row, by item id (a tab's id: its module, or `view:<id>`) */
  tabs?: Record<string, { order?: string[]; hidden?: string[] }>
  /**
   * admin item ids shown as items at the sidebar's bottom; the others are in its Admin menu
   * (`DEFAULT_PROMOTED` in `arrange.ts` when not set)
   */
  promoted?: string[]
  /** the sidebar shows its items' icons only, their names in tooltips */
  iconsOnly?: boolean
  /** the context's colour (`#rrggbb`): the sidebar's selected item and Home's icon take it */
  tint?: string
  /**
   * groups of sidebar items, by their id in `order` (`folder:<id>`): their name and their items'
   * ids, which then aren't in `order` themselves. Only with `free`.
   */
  folders?: Record<string, { label: string; items: string[] }>
}
