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

const isStringList = (value: unknown) =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')

const declarationProblem = (declaration: Record<string, unknown>) => {
  const { version, required, pieces, optionalPieces, optional, check } = declaration
  if (!Number.isInteger(version) || (version as number) < 1) return 'version must be a whole number from 1'
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
 * The slots a manifest declares. A name must start with the addon's own name, and may not be one of
 * AYON's slots or already declared: the rest is skipped, naming both addons where there are two.
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
  for (const item of list) {
    const declaration = (item || {}) as Record<string, unknown>
    const name = typeof declaration.name === 'string' ? declaration.name : undefined
    const skip = (reason: string) => skipped.push({ addon: addon.name, slot: name, reason })

    if (!name || !/^[A-Za-z0-9_-]+(\.[A-Za-z][A-Za-z0-9_]*)+$/.test(name)) {
      skip(`invalid name ${describe(declaration.name)}: use "${prefix}<name>"`)
      continue
    }
    if (Object.prototype.hasOwnProperty.call(builtIn, name)) {
      skip("it is one of AYON's own slots")
      continue
    }
    if (!name.startsWith(prefix)) {
      skip(
        `only addon "${name.split('.')[0]}" can declare it: slots of addon "${addon.name}" start with "${prefix}"`,
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
      skip(
        !slotName
          ? `invalid slot ${describe(slot)}`
          : slotName.includes('.')
          ? `this AYON version has no such slot, and no addon in the bundle declares it (it would be addon "${
              slotName.split('.')[0]
            }")`
          : 'this AYON version has no such slot',
        slotName,
        idName,
      )
      continue
    }
    const definition = slots[slotName]
    const owner = (definition as Partial<DeclaredSlot>).owner?.name
    const { slotVersion } = item as { slotVersion?: unknown }
    if (slotVersion !== undefined) {
      if (!Number.isInteger(slotVersion)) {
        skip(`invalid slotVersion ${describe(slotVersion)}`, slotName, idName)
        continue
      }
      if ((slotVersion as number) > definition.version) {
        skip(
          `it was built for version ${slotVersion} of the slot, but ${
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
          `it was built for version ${slotVersion} of the slot, but addon "${owner}" has version ${definition.version}, which is not compatible: update addon "${addon.name}"`,
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

    contributions.push({
      ...(item as object),
      key: `${addon.name}.${idName}`,
      addon,
    } as AnyContribution)
  }

  return { contributions, skipped }
}

/** One line for the console, naming the addon, the contribution and the reason. */
export const formatSkipped = ({ addon, slot, id, reason }: SkippedContribution) =>
  `[addon ${addon}] skipped contribution${id ? ` "${id}"` : ''}${
    slot ? ` for slot "${slot}"` : ''
  }: ${reason}`
