// The slots of other addons in the dev shell: what the contract packages among the addon's
// dependencies declare (slots.js) and the scenes they render them in (previews.js). The dev server
// imports both (/@ayon-addon/contracts, standalone.ts); this module keeps what came of them. No
// React or package imports: unit tests import it as is.
import type { ComponentType } from 'react'
import { checkPreviews, validScenes } from '../../src/contractPreviews'
import type { PreviewField } from '../../src/contractPreviews'

/** One contract package as the dev server's virtual module lists it. */
export interface ContractModule {
  package: string
  /** the paths as its package.json gives them */
  entries: { slots?: string; previews?: string }
  slots: () => Promise<{ slots?: unknown }>
  previews?: () => Promise<{ previews?: unknown }>
}

export interface ContractSlot {
  name: string
  /** the declaring addon: the name's prefix */
  addon: string
  package: string
  description?: string
  declaration: Record<string, unknown>
}

export interface SceneProps {
  values: Record<string, any>
  setValues: (patch: Record<string, any>) => void
}

/** A scene of a contract package's previews: a mock of the declaring addon's UI with its slots. */
export interface Scene {
  /** `<package>:<id>`, the scene in the URL */
  key: string
  id: string
  label: string
  description?: string
  package: string
  slots: string[]
  fields: PreviewField[]
  component: ComponentType<SceneProps>
}

export interface Contract {
  package: string
  /** the declaring addons (one, unless the package declares slots of several) */
  addons: string[]
  previewsEntry?: string
  slots: ContractSlot[]
  scenes: Scene[]
  /** what failed to load or is wrong in its previews */
  problems: string[]
}

export const sceneKey = (pkg: string, id: string) => `${pkg}:${id}`

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
  if (entries.previews && !loaded.previewsError) {
    problems.push(
      ...checkPreviews(loaded.previews, declared, entries.previews).map(
        ({ scene, reason }) => `${scene ? `${scene}: ` : ''}${reason}`,
      ),
    )
  }

  const slots = declarations.map(
    (declaration): ContractSlot => ({
      name: declaration.name as string,
      addon: (declaration.name as string).split('.')[0],
      package: name,
      description: typeof declaration.description === 'string' ? declaration.description : undefined,
      declaration,
    }),
  )
  const scenes = validScenes(loaded.previews, declared).map(
    (scene): Scene => ({
      ...scene,
      key: sceneKey(name, scene.id),
      package: name,
      component: scene.component as Scene['component'],
    }),
  )
  return {
    package: name,
    addons: [...new Set(slots.map((slot) => slot.addon))],
    previewsEntry: entries.previews,
    slots,
    scenes,
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
          slots: contract.slots.filter((slot) => slot.addon === addon).map((slot) => slot.declaration),
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

/** The scenes that render a slot, in the order their package lists them. */
export const scenesOf = (slot?: string, list: readonly Contract[] = contracts) =>
  slot ? list.flatMap((contract) => contract.scenes).filter((scene) => scene.slots.includes(slot)) : []

/**
 * The scene on stage: the one in the selection, else the first that renders the selected
 * contribution's slot (`ayon-addon open <slot> <id>`). Undefined for AYON's slots.
 */
export const sceneFor = (
  selection: { scene?: string; slot?: string },
  list: readonly Contract[] = contracts,
) => {
  const picked = list.flatMap((contract) => contract.scenes).find((scene) => scene.key === selection.scene)
  const covering = scenesOf(selection.slot, list)
  if (picked && (!covering.length || covering.includes(picked))) return picked
  return covering[0]
}

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

/** What to tell the developer when no scene renders a slot: where to add one. */
export const noSceneNote = (slot: ContractSlot, contract?: Contract) =>
  contract?.previewsEntry
    ? `No preview scene in ${slot.package} renders ${slot.name}: add one to ${contract.previewsEntry} in that package.`
    : `No preview scene in ${slot.package} renders ${slot.name}: the package has no previews ` +
      `("ayonAddon": { "previews": "./previews.js" } in its package.json).`
