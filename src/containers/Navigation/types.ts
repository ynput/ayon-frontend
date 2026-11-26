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
}

/** What the user can open: the `accessLevels` a tab may require. */
export type NavAccess = Record<string, boolean>

/**
 * A layout over the registry: which items show and in what order. Named layouts provide one later;
 * until then every context uses the identity layout.
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
   * (`DEFAULT_PROMOTED` in `layouts/applyLayout.ts` when not set)
   */
  promoted?: string[]
}
