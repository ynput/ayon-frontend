// The slots: places in the AYON web UI that addons contribute to.
// SlotMap is the single source of truth. Each entry has the slot's version, the description the
// host reads straight from the manifest (`meta`), the context the addon's code gets (`context`)
// and the pieces of code it loads (`pieces`). SLOTS repeats what the host checks at run time.

/**
 * A piece of a contribution: a dynamic import of a file in the addon, `() => import('./NotesTab')`.
 * The build puts each piece in its own chunk, and the slot decides when it loads.
 */
export type Loader<T> = () => Promise<{ default: T }>

/**
 * Every slot this version of AYON has. Keys are slot names (`'project.page'`); each value has
 * the slot's `version`, its description fields (`meta`), the context its code gets (`context`)
 * and its pieces (`pieces`).
 */
export interface SlotMap {}

/** The name of a slot, e.g. `'project.page'`. */
export type SlotName = keyof SlotMap & string

/** What the code of a contribution to slot `S` gets: `{ slot: S, ...context }`. */
export type SlotContext<S extends SlotName> = S extends SlotName
  ? { slot: S } & SlotMap[S]['context']
  : never

/** Props of the component a contribution to slot `S` renders. Same as `SlotContext<S>`. */
export type SlotProps<S extends SlotName> = SlotContext<S>

/** What the host checks for each slot when it reads a manifest. */
export interface SlotDefinition {
  version: number
  /** description fields that must be non-empty strings */
  required: readonly string[]
  /** pieces that must be loaders */
  pieces: readonly string[]
  /** pieces that may be left out */
  optionalPieces?: readonly string[]
}

/** The slots this host knows. A contribution to any other slot is skipped. */
export const SLOTS: { readonly [S in SlotName]: SlotDefinition } = {}

export const isKnownSlot = (slot: unknown): slot is SlotName =>
  typeof slot === 'string' && Object.prototype.hasOwnProperty.call(SLOTS, slot)
