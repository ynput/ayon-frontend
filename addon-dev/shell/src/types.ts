import type { AddonInfo, EntityRef, SlotName } from '@ynput/ayon-addon'
import type { ContractModule } from './contractModel'

/** What the dev server's virtual entry passes to startShell. */
export interface ShellOptions {
  addon: AddonInfo
  /** the addon's manifest module (default export of src/manifest.ts) */
  manifest: unknown
  /** the AYON server the dev server proxies to */
  serverUrl: string
  /** the dev server sends AYON_API_KEY (or the workbench key) with every proxied request */
  signedInWithKey: boolean
  /** the contract packages among the addon's dependencies: other addons' slots and their previews */
  contracts?: ContractModule[]
  /** contract packages the dev server couldn't read (their package.json) */
  contractProblems?: string[]
}

/** What the shell shows, kept in the URL so `ayon-addon open` and bookmarks can set it. */
export interface ShellSelection {
  /** the place on stage (places.ts): an AYON surface, a preview scene `<package>:<id>`, `other` */
  surface?: string
  /**
   * the contribution `ayon-addon open` (and a preview fixture) is about: its slot and its id there.
   * The panel doesn't list it; the stage shows it once (its tab, its Customize section) and the
   * status page's fixture, run and piece reports are about it.
   */
  slot?: SlotName
  id?: string
  /** Show all: list every place and slot, used or not */
  showAll?: boolean
  projectName?: string
  /** the studio's project selection (studio pages, the project list) */
  projectNames?: string[]
  /** the entities the slot is about (details panel, menus, table rows) */
  entityType?: string
  entities: EntityRef[]
  /** the project table page for the projectTable and table slots */
  page?: 'overview' | 'products' | 'lists'
  /** the user the user details panel shows (else the signed-in one, or the first user) */
  userName?: string
  /** a preview scene's values the developer changed (the rest are the fields' defaults) */
  sceneValues?: Record<string, unknown>
  /** a fixture name: preview mode, no server */
  preview?: string
}

/** A response recorded from AYON, or answered from a fixture in preview mode. */
export interface RecordedResponse {
  status: number
  body: unknown
}

/**
 * A preview fixture (`dev/fixtures/<name>.json` in the addon's frontend): the slot context and
 * the server's answers, so a contribution renders the same way without a server.
 */
export interface Fixture {
  slot: SlotName
  id: string
  /** the slot context without functions (header and toolbar items get navigate, dialogs close) */
  context: Record<string, unknown>
  user?: { name: string; attrib?: Record<string, unknown>; data?: Record<string, unknown> }
  /** keyed `GET /api/...` or `graphql <OperationName>` */
  responses: Record<string, RecordedResponse>
}

/** What the shell reports to `ayon-addon open | preview` (window.__AYON_ADDON_SHELL__). */
export interface ShellStatus {
  ready: boolean
  mode: 'live' | 'preview'
  selection: ShellSelection
  /** requests a preview fixture has no answer for */
  unmatched: string[]
  /** preview: the fixture answers the page used */
  used: string[]
  /** the current selection as a fixture: context plus the responses recorded since it was set */
  fixture: () => Fixture | undefined
  /** runs the selection's menu item, shortcut or column menu item with its slot's context */
  run: () => Promise<void>
  /** what the selected contribution's own code did (tracking.ts): `ayon-addon open` checks it rendered */
  pieces: PieceStatus
}

/** The selected contribution's pieces: which the shell tracks, how many are mounted, how often `run` ran. */
export interface PieceStatus {
  /** the addon's manifest has the selected contribution (`slot` and `contribution` in the URL) */
  found: boolean
  tracked: string[]
  /** per component piece: mounted now (a column has one per cell) */
  mounted: Record<string, number>
  /** per component piece: mounted at any time since the page loaded */
  everMounted: string[]
  /** calls of the `run` piece */
  runs: number
}
