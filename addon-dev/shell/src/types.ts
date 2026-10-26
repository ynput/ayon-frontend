import type { AddonInfo, EntityRef, SlotName } from '@ynput/ayon-addon'

/** What the dev server's virtual entry passes to startShell. */
export interface ShellOptions {
  addon: AddonInfo
  /** the addon's manifest module (default export of src/manifest.ts) */
  manifest: unknown
  /** the AYON server the dev server proxies to */
  serverUrl: string
  /** the dev server sends AYON_API_KEY (or the workbench key) with every proxied request */
  signedInWithKey: boolean
}

/** What the shell shows, kept in the URL so `ayon-addon open` and bookmarks can set it. */
export interface ShellSelection {
  slot?: SlotName
  /** the contribution's id in its slot */
  id?: string
  projectName?: string
  /** the entities the slot is about (details panel, menus, table rows) */
  entityType?: string
  entities: EntityRef[]
  /** the project table page for the projectTable and table slots */
  page?: 'overview' | 'products' | 'lists'
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
  /** the slot context without functions (popups get open / onClose from the shell) */
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
  /** runs a menu item (`run` piece) of the selection with its context */
  run: () => Promise<void>
}
