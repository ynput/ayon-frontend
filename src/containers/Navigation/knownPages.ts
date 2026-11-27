import type { NavSection } from './types'

export interface KnownPlacement {
  section: NavSection
  icon: string
  /** replaces the page's title on the sidebar item */
  label?: string
  /** the item groups pages: `group:<addon>/<group>` */
  group?: { addon: string; id: string; title: string }
  /** within its section, lower first (what the page declares wins) */
  order?: number
}

/**
 * Where AYON puts the pages of addons that don't declare `icon`, `section` or `group` yet, by the
 * page's module (its URL segment). What a page declares itself wins. Any other addon page goes to
 * `other` with the `extension` icon.
 */
// Default positions (Milan's "My layout", 2026-11-27): Schedule, Time and Reports in that order;
// Storyboards with the pipeline's pages, first
export const KNOWN_PROJECT_PAGES: Record<string, KnownPlacement> = {
  storyboards: { section: 'pipeline', icon: 'movie', order: 1 },
  scheduler: { section: 'plan', icon: 'calendar_month', order: 10 },
  time: { section: 'plan', icon: 'timer', order: 20 },
  reports: { section: 'plan', icon: 'monitoring', order: 30 },
  workflows: { section: 'pipeline', icon: 'account_tree' },
  nodegraph: { section: 'pipeline', icon: 'hub', label: 'Node Graph' },
  // the archival addon is a classic (iframe) addon
  archival_tool: { section: 'pipeline', icon: 'inventory_2', label: 'Archival' },
}

const PLANNER_GROUP = { addon: 'planner', id: 'planner', title: 'Planner' }

export const KNOWN_STUDIO_PAGES: Record<string, KnownPlacement> = {
  bookings: { section: 'plan', icon: 'event_note', group: PLANNER_GROUP, order: 10 },
  resources: { section: 'plan', icon: 'groups', group: PLANNER_GROUP, order: 10 },
  // the splash AYON shows on Home when the planner addon is missing, in the planner's place
  planner: { section: 'plan', icon: 'event_note', group: PLANNER_GROUP, order: 10 },
  time: { section: 'plan', icon: 'timer', order: 20 },
  channels: { section: 'other', icon: 'forum' },
}

export const DEFAULT_ADDON_ICON = 'extension'
