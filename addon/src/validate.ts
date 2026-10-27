import type { AddonInfo, AnyContribution } from './contributions'
import { SLOTS } from './slots'
import type { SlotDefinition } from './slots'

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
        slotName ? "this AYON version has no such slot" : `invalid slot ${describe(slot)}`,
        slotName,
        idName,
      )
      continue
    }
    const definition = slots[slotName]
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
    const problem = definition.check?.(item as Record<string, unknown>)
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
