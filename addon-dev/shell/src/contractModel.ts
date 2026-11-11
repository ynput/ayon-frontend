// The slots of other addons in the dev shell: what the contract packages among the addon's
// dependencies declare (slots.js) and the cases they give to render contributions with
// (previews.js). The dev server imports both (/@ayon-addon/contracts, standalone.ts); this module
// keeps what came of them. No React or package imports: unit tests import it as is.
import type { ComponentType, ReactNode } from 'react'
import { checkPreviews, validCases } from '../../src/contractPreviews'
import type { PreviewCase } from '../../src/contractPreviews'

/** One contract package as the dev server's virtual module lists it. */
export interface ContractModule {
  package: string
  /** the paths as its package.json gives them */
  entries: { slots?: string; previews?: string }
  slots: () => Promise<{ slots?: unknown }>
  previews?: () => Promise<{ previews?: unknown }>
}

/** How the shell shows a slot, from its declaration's pieces: rendered, run as a menu item, or neither. */
export type SlotKind = 'component' | 'menu' | 'other'

export type PreviewFrame = ComponentType<{ context: Record<string, unknown>; children: ReactNode }>

export interface ContractSlot {
  name: string
  /** the declaring addon: the name's prefix */
  addon: string
  package: string
  description?: string
  kind: SlotKind
  pieces: string[]
  declaration: Record<string, unknown>
  /** no previews: the shell says how to add them */
  preview?: { frame?: PreviewFrame; cases: PreviewCase[] }
}

export interface Contract {
  package: string
  /** the declaring addons (one, unless the package declares slots of several) */
  addons: string[]
  previewsEntry?: string
  slots: ContractSlot[]
  /** what failed to load or is wrong in its previews */
  problems: string[]
}

const asList = (value: unknown) => (Array.isArray(value) ? value.map(String) : [])

export const slotKind = (pieces: readonly string[]): SlotKind =>
  pieces.includes('component') ? 'component' : pieces.includes('run') ? 'menu' : 'other'

/** A contract package from its loaded modules (or the errors loading them). */
export const buildContract = (
  module: Pick<ContractModule, 'package' | 'entries'>,
  loaded: { slots?: unknown; previews?: unknown; slotsError?: string; previewsError?: string },
): Contract => {
  const { package: name, entries } = module
  const problems: string[] = []
  if (loaded.slotsError) problems.push(`its slots failed to load: ${loaded.slotsError}`)
  if (loaded.previewsError) problems.push(`its previews failed to load: ${loaded.previewsError}`)
  const declarations = (Array.isArray(loaded.slots) ? loaded.slots : []).filter(
    (slot): slot is Record<string, unknown> => !!slot && typeof slot.name === 'string',
  )
  if (!loaded.slotsError && !Array.isArray(loaded.slots)) {
    problems.push(`${entries.slots} does not export a "slots" list`)
  }
  const declared = declarations.map((slot) => slot.name as string)
  const previews = (loaded.previews ?? {}) as Record<string, { frame?: unknown } | undefined>
  if (entries.previews && !loaded.previewsError) {
    problems.push(
      ...checkPreviews(loaded.previews, declared, entries.previews).map(
        ({ slot, reason }) => `${slot ? `${slot}: ` : ''}${reason}`,
      ),
    )
  }

  const slots = declarations.map((declaration): ContractSlot => {
    const slotName = declaration.name as string
    const pieces = [...asList(declaration.pieces), ...asList(declaration.optionalPieces)]
    const preview = typeof previews === 'object' ? previews[slotName] : undefined
    const cases = validCases(preview)
    return {
      name: slotName,
      addon: slotName.split('.')[0],
      package: name,
      description:
        typeof declaration.description === 'string' ? declaration.description : undefined,
      kind: slotKind(pieces),
      pieces,
      declaration,
      preview: cases.length
        ? {
            frame:
              typeof preview?.frame === 'function' ? (preview.frame as PreviewFrame) : undefined,
            cases,
          }
        : undefined,
    }
  })
  return {
    package: name,
    addons: [...new Set(slots.map((slot) => slot.addon))],
    previewsEntry: entries.previews,
    slots,
    problems,
  }
}

/**
 * The manifests that make the shell's registry take contributions to these slots: one per
 * declaring addon, with its slots and no contributions, as if that addon were installed. The
 * addon's own slots are left to its own manifest.
 */
export const contractManifests = (contracts: readonly Contract[], ownAddon: string) =>
  contracts.flatMap((contract) =>
    contract.addons
      .filter((addon) => addon !== ownAddon)
      .map((addon) => ({
        addon: { name: addon, version: 'contract', remote: contract.package },
        manifest: {
          slots: contract.slots
            .filter((slot) => slot.addon === addon)
            .map((slot) => slot.declaration),
          contributes: [],
        },
      })),
  )

let contracts: Contract[] = []

export const setContracts = (next: Contract[]) => {
  contracts = next
}
export const getContracts = (): readonly Contract[] => contracts

/** A slot a contract package declares, or undefined for AYON's slots and the addon's own. */
export const contractSlot = (slot?: string) =>
  slot ? contracts.flatMap((contract) => contract.slots).find((s) => s.name === slot) : undefined

/** The developer panel's areas for these slots: one per contract package, its slots by name. */
export const contractAreas = (list: readonly Contract[] = contracts) =>
  list.map((contract) => ({
    label: contract.addons.join(', ') || contract.package,
    icon: 'extension',
    package: contract.package,
    sections: [
      {
        slots: contract.slots.map((slot) => ({
          slot: slot.name,
          label: slot.name.slice(slot.addon.length + 1),
        })),
      },
    ],
  }))

/** What to tell the developer when a slot has no previews: where to add them. */
export const noPreviewsNote = (slot: ContractSlot, contract?: Contract) =>
  contract?.previewsEntry
    ? `${slot.package} has no previews for ${slot.name}: add its cases to ${contract.previewsEntry} in that package.`
    : `${slot.package} has no previews: add a previews.js with cases for ${slot.name} to that package ` +
      `("ayonAddon": { "previews": "./previews.js" } in its package.json).`
