import type { AddonInfo, AnyContribution } from './contributions'
import { SLOTS } from './slots'
import type { SlotDeclaration, SlotDefinition } from './slots'

/** Contribution ids: a letter, then letters, digits and `_` (they end up in URLs and column ids). */
export const ID_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/

/** A contribution the host did not register, and why. */
export interface SkippedContribution {
  addon: string
  slot?: string
  id?: string
  reason: string
}

export interface ManifestCheck {
  contributions: AnyContribution[]
  skipped: SkippedContribution[]
}

/** A slot an addon declared, and that addon. */
export interface DeclaredSlot extends SlotDeclaration {
  owner: AddonInfo
}

/** A slot declaration the host did not register, and why. */
export interface SkippedDeclaration {
  addon: string
  slot?: string
  reason: string
}

export interface DeclarationCheck {
  slots: DeclaredSlot[]
  skipped: SkippedDeclaration[]
}

/** The part of a slot name an addon chooses: `<addon>.<name>`, no further dots. */
const LOCAL_SLOT_NAME = /^[A-Za-z][A-Za-z0-9_]*$/

const prefixCache = new WeakMap<object, ReadonlySet<string>>()

/**
 * The first parts of AYON's own slot names (`project`, `studio`, `header`, ...): an addon with one
 * of these names can't declare slots, so AYON can add slots there.
 */
export const reservedSlotPrefixes = (
  builtIn: { readonly [slot: string]: SlotDefinition } = SLOTS,
): ReadonlySet<string> => {
  let prefixes = prefixCache.get(builtIn)
  if (!prefixes) {
    prefixes = new Set(Object.keys(builtIn).map((name) => name.split('.')[0]))
    prefixCache.set(builtIn, prefixes)
  }
  return prefixes
}

/**
 * The addon that may declare a slot of this name: everything before its last dot (addon names can
 * have dots). Undefined for a name without a dot or under one of AYON's prefixes: AYON's own.
 */
export const slotNameOwner = (
  name: string,
  builtIn: { readonly [slot: string]: SlotDefinition } = SLOTS,
): string | undefined => {
  const dot = name.lastIndexOf('.')
  if (dot < 1) return undefined
  const owner = name.slice(0, dot)
  return reservedSlotPrefixes(builtIn).has(owner) ? undefined : owner
}

const isStringList = (value: unknown) =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')

const declarationProblem = (declaration: Record<string, unknown>) => {
  const { version, label, required, pieces, optionalPieces, optional, check } = declaration
  if (!Number.isInteger(version) || (version as number) < 1) return 'version must be a whole number from 1'
  if (label !== undefined && (typeof label !== 'string' || !label.trim())) return 'label must be a non-empty string'
  if (!isStringList(required)) return 'required must be a list of field names'
  if (!isStringList(pieces)) return 'pieces must be a list of piece names'
  if (optionalPieces !== undefined && !isStringList(optionalPieces))
    return 'optionalPieces must be a list of piece names'
  if (
    optional !== undefined &&
    !Object.values((optional || {}) as object).every(
      // g and y make a pattern remember where it stopped, so the same value would pass only every other time
      (pattern) => pattern instanceof RegExp && !pattern.global && !pattern.sticky,
    )
  )
    return 'optional must map field names to patterns without the g or y flag'
  if (check !== undefined && typeof check !== 'function') return 'check must be a function'
}

/**
 * The slots a manifest declares. A name is `<addon>.<name>` with the addon's own name, and may not
 * be one of AYON's slots or already declared: the rest is skipped, naming both addons where there
 * are two. An addon named like the first part of AYON's slots (`project`, ...) can't declare any.
 */
export const checkSlotDeclarations = (
  addon: AddonInfo,
  manifest: unknown,
  declared: readonly DeclaredSlot[] = [],
  builtIn: { readonly [slot: string]: SlotDefinition } = SLOTS,
): DeclarationCheck => {
  const slots: DeclaredSlot[] = []
  const skipped: SkippedDeclaration[] = []
  const list = (manifest as { slots?: unknown } | null)?.slots
  if (list === undefined) return { slots, skipped }
  if (!Array.isArray(list)) {
    skipped.push({ addon: addon.name, reason: 'the manifest\'s "slots" is not a list' })
    return { slots, skipped }
  }

  const prefix = `${addon.name}.`
  const reserved = reservedSlotPrefixes(builtIn).has(addon.name)
  for (const item of list) {
    const declaration = (item || {}) as Record<string, unknown>
    const name = typeof declaration.name === 'string' ? declaration.name : undefined
    const skip = (reason: string) => skipped.push({ addon: addon.name, slot: name, reason })

    if (name && Object.prototype.hasOwnProperty.call(builtIn, name)) {
      skip("it is one of AYON's own slots")
      continue
    }
    if (reserved) {
      skip(`slots named "${prefix}<name>" are AYON's: an addon named "${addon.name}" can't declare slots`)
      continue
    }
    if (!name || !name.startsWith(prefix) || !LOCAL_SLOT_NAME.test(name.slice(prefix.length))) {
      const owner = name ? slotNameOwner(name, builtIn) : undefined
      skip(
        owner && owner !== addon.name
          ? `only addon "${owner}" can declare it: slots of addon "${addon.name}" are named "${prefix}<name>"`
          : name && name.indexOf('.') > 0 && !owner
          ? `names under "${name.slice(0, name.lastIndexOf('.'))}." are AYON's: slots of addon "${addon.name}" are named "${prefix}<name>"`
          : `invalid name ${describe(declaration.name)}: use "${prefix}<name>", <name> a letter, then letters, digits and _`,
      )
      continue
    }
    const existing = [...declared, ...slots].find((slot) => slot.name === name)
    if (existing) {
      skip(`addon "${existing.owner.name}" already declares it`)
      continue
    }
    const problem = declarationProblem(declaration)
    if (problem) {
      skip(problem)
      continue
    }
    slots.push({ ...(declaration as unknown as SlotDeclaration), owner: addon })
  }
  return { slots, skipped }
}

/** One line for the console, naming the addon, the slot and the reason. */
export const formatSkippedDeclaration = ({ addon, slot, reason }: SkippedDeclaration) =>
  `[addon ${addon}] skipped slot declaration${slot ? ` "${slot}"` : ''}: ${reason}`

const sameAddon = (a: AddonInfo, b: AddonInfo) =>
  a === b || (a.name === b.name && a.version === b.version && a.remote === b.remote)

const describe = (value: unknown) => (typeof value === 'string' ? `"${value}"` : String(value))

/**
 * Checks a manifest the way the host does when it loads one: unknown slots, invalid ids,
 * missing description fields or pieces and duplicates are skipped, the rest is returned with
 * its key (`<addon>.<id>`). `ayon-addon check` reports the same problems.
 */
export const checkManifest = (
  addon: AddonInfo,
  manifest: unknown,
  slots: { readonly [slot: string]: SlotDefinition } = SLOTS,
  /**
   * the contribution built from each manifest item last time: an unchanged item gets the same
   * object back, so components that depend on it don't re-render (the registry keeps one)
   */
  built?: WeakMap<object, AnyContribution>,
): ManifestCheck => {
  const contributions: AnyContribution[] = []
  const skipped: SkippedContribution[] = []
  const skip = (reason: string, slot?: string, id?: string) =>
    skipped.push({ addon: addon.name, slot, id, reason })

  const contributes = (manifest as { contributes?: unknown } | null)?.contributes
  if (!Array.isArray(contributes)) {
    skip('the manifest has no "contributes" list (export default defineAddon({ contributes }))')
    return { contributions, skipped }
  }

  const seen = new Set<string>()
  for (const item of contributes) {
    const { slot, id } = (item || {}) as { slot?: unknown; id?: unknown }
    const slotName = typeof slot === 'string' ? slot : undefined
    const idName = typeof id === 'string' ? id : undefined

    if (!slotName || !Object.prototype.hasOwnProperty.call(slots, slotName)) {
      const declaringAddon = slotName && slotNameOwner(slotName)
      skip(
        !slotName
          ? `invalid slot ${describe(slot)}`
          : declaringAddon
          ? `this AYON version has no such slot, and no addon in the bundle declares it (it would be addon "${declaringAddon}")`
          : // AYON's own name (or no addon could declare it): a slot of a newer AYON
            'this AYON version has no such slot',
        slotName,
        idName,
      )
      continue
    }
    const definition = slots[slotName]
    const owner = (definition as Partial<DeclaredSlot>).owner?.name
    // a contribution to an addon's slot without slotVersion was built for its first version; one to
    // AYON's slots without it isn't checked
    const stamped = (item as { slotVersion?: unknown }).slotVersion
    const slotVersion = stamped === undefined && owner ? 1 : stamped
    const builtFor =
      stamped === undefined
        ? 'it has no slotVersion, so it counts as built for version 1 of the slot'
        : `it was built for version ${slotVersion} of the slot`
    if (slotVersion !== undefined) {
      if (!Number.isInteger(slotVersion)) {
        skip(`invalid slotVersion ${describe(slotVersion)}`, slotName, idName)
        continue
      }
      if ((slotVersion as number) > definition.version) {
        skip(
          `${builtFor}, but ${
            owner ? `addon "${owner}"` : 'this AYON version'
          } has version ${definition.version}: update ${owner ? `addon "${owner}"` : 'AYON'}`,
          slotName,
          idName,
        )
        continue
      }
      // a new version of an addon's slot is a breaking change: code built for an older one can't run
      if (owner && (slotVersion as number) < definition.version) {
        skip(
          `${builtFor}, but addon "${owner}" has version ${definition.version}, which is not compatible: update addon "${addon.name}"`,
          slotName,
          idName,
        )
        continue
      }
    }
    if (!idName || !ID_PATTERN.test(idName)) {
      skip(
        `invalid id ${describe(id)}: use a letter, then letters, digits and _`,
        slotName,
        idName,
      )
      continue
    }
    const missing = definition.required.filter(
      (field) => typeof (item as Record<string, unknown>)[field] !== 'string',
    )
    if (missing.length) {
      skip(`missing ${missing.join(', ')}`, slotName, idName)
      continue
    }
    const badFields = Object.entries(definition.optional || {}).filter(([field, pattern]) => {
      const value = (item as Record<string, unknown>)[field]
      return value !== undefined && (typeof value !== 'string' || !pattern.test(value))
    })
    if (badFields.length) {
      skip(
        badFields
          .map(([field]) => `invalid ${field} ${describe((item as Record<string, unknown>)[field])}`)
          .join(', '),
        slotName,
        idName,
      )
      continue
    }
    const badPieces = [
      ...definition.pieces.filter(
        (piece) => typeof (item as Record<string, unknown>)[piece] !== 'function',
      ),
      ...(definition.optionalPieces || []).filter((piece) => {
        const value = (item as Record<string, unknown>)[piece]
        return value !== undefined && typeof value !== 'function'
      }),
    ]
    if (badPieces.length) {
      skip(
        `${badPieces.join(', ')} must be a loader: () => import('./File')`,
        slotName,
        idName,
      )
      continue
    }
    let problem: string | undefined
    try {
      problem = definition.check?.(item as Record<string, unknown>)
    } catch (error) {
      // the check belongs to the slot's addon: its bug skips this contribution, nothing else
      problem = `the check of the slot failed${owner ? ` (addon "${owner}")` : ''}: ${String(error)}`
    }
    if (problem) {
      skip(problem, slotName, idName)
      continue
    }
    const dedupeKey = `${slotName}:${idName}`
    if (seen.has(dedupeKey)) {
      skip(`duplicate id in slot "${slotName}"`, slotName, idName)
      continue
    }
    seen.add(dedupeKey)

    const key = `${addon.name}.${idName}`
    const previous = built?.get(item as object)
    const contribution =
      previous && previous.key === key && sameAddon(previous.addon, addon)
        ? previous
        : ({ ...(item as object), key, addon } as AnyContribution)
    built?.set(item as object, contribution)
    contributions.push(contribution)
  }

  return { contributions, skipped }
}

/** One line for the console, naming the addon, the contribution and the reason. */
export const formatSkipped = ({ addon, slot, id, reason }: SkippedContribution) =>
  `[addon ${addon}] skipped contribution${id ? ` "${id}"` : ''}${
    slot ? ` for slot "${slot}"` : ''
  }: ${reason}`
