// Slots of other addons: their contract packages (@ynput/ayon-addon-<addon>) mark themselves in
// their package.json with `"ayonAddon": { "slots": "./slots.js", "previews": "./previews.js" }`.
// `slots` is a plain JS module that exports the declarations as `slots`; `previews` (optional) one
// that exports `previews`, the contexts the dev shell renders contributions with (contractPreviews.ts).
// `check` and `slots` read those of the addon's own dependencies, the dev shell imports them.
import { readFileSync, realpathSync } from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'
import { checkPreviews } from './contractPreviews.js'
import { findPackageDir } from './project.js'

export interface ContractSlot {
  name: string
  version: number
  description?: string
  required: readonly string[]
  pieces: readonly string[]
  optionalPieces?: readonly string[]
  /** the contract package it comes from */
  package: string
}

export interface ContractSlots {
  slots: ContractSlot[]
  problems: { reason: string }[]
}

/** A contract package among the addon's dependencies, with the files its package.json names. */
export interface ContractPackage {
  name: string
  /** the module with the declarations (absolute, symlinks resolved) */
  slots?: string
  /** the module with the previews (absolute, symlinks resolved) */
  previews?: string
  /** the paths as package.json gives them */
  entries: { slots?: string; previews?: string }
}

const readJson = (file: string) => JSON.parse(readFileSync(file, 'utf8'))

/** The contract packages in the addon's dependencies and devDependencies. */
export const findContractPackages = (root: string) => {
  const pkg = readJson(path.join(root, 'package.json'))
  const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
  const packages: ContractPackage[] = []
  const problems: { reason: string }[] = []

  for (const name of names) {
    const dir = findPackageDir(root, name)
    if (!dir) continue
    const marker = readJson(path.join(dir, 'package.json')).ayonAddon
    if (marker === undefined) continue
    const contract: ContractPackage = { name, entries: {} }
    for (const key of ['slots', 'previews'] as const) {
      const entry = marker?.[key]
      if (entry === undefined) continue
      if (typeof entry !== 'string') {
        problems.push({ reason: `${name}: "ayonAddon.${key}" must be a path` })
        continue
      }
      contract.entries[key] = entry
      try {
        contract[key] = realpathSync(path.resolve(dir, entry))
      } catch {
        problems.push({ reason: `${name}: ${entry} ("ayonAddon.${key}") does not exist` })
      }
    }
    packages.push(contract)
  }
  return { packages, problems }
}

/**
 * The dev shell's /@ayon-addon/contracts module (standalone.ts): the declarations and previews,
 * imported by the page through Vite (previews are React components). By file path, so a contract
 * package needn't list them in its "exports". Each is a dynamic import: a broken file is reported
 * in the developer panel, not a blank page.
 */
export const contractsCode = (root: string, addonName: string) => {
  const { packages, problems } = findContractPackages(root)
  const load = (file?: string) =>
    file ? `() => import(${JSON.stringify(file.split(path.sep).join('/'))})` : 'undefined'
  const contracts = packages
    .filter((contract) => contract.slots)
    .map(
      (contract) =>
        `{ package: ${JSON.stringify(contract.name)}, entries: ${JSON.stringify(contract.entries)}, ` +
        `slots: ${load(contract.slots)}, previews: ${load(contract.previews)} }`,
    )
  return [
    `// the contract packages of ${addonName}`,
    `export const contracts = [${contracts.join(', ')}]`,
    `export const contractProblems = ${JSON.stringify(problems.map((p) => p.reason))}`,
  ].join('\n')
}

export const readContractSlots = async (root: string): Promise<ContractSlots> => {
  const found = findContractPackages(root)
  const result: ContractSlots = { slots: [], problems: [...found.problems] }

  for (const contract of found.packages) {
    if (!contract.slots) continue
    try {
      const module = await import(pathToFileURL(contract.slots).href)
      if (!Array.isArray(module.slots)) {
        throw new Error(`${contract.entries.slots} does not export a "slots" list`)
      }
      result.slots.push(...module.slots.map((slot: ContractSlot) => ({ ...slot, package: contract.name })))
    } catch (error) {
      result.problems.push({
        reason: `${contract.name}: its slots failed to load: ${(error as Error).message}`,
      })
    }
  }
  return result
}

export interface ContractPreviews {
  /** per contract package with previews: the slots that have some, and their number of cases */
  previews: { package: string; slots: { name: string; cases: number }[] }[]
  problems: { slot?: string; reason: string }[]
}

/**
 * The previews of the contract packages, checked against the slots each one declares. Loaded in
 * Node: a previews module may import React (resolved from where the package is), nothing that
 * needs a browser.
 */
export const readContractPreviews = async (
  root: string,
  slots: readonly ContractSlot[],
): Promise<ContractPreviews> => {
  const result: ContractPreviews = { previews: [], problems: [] }
  for (const contract of findContractPackages(root).packages) {
    if (!contract.previews) continue
    let module: { previews?: unknown }
    try {
      module = await import(pathToFileURL(contract.previews).href)
    } catch (error) {
      result.problems.push({
        reason: `${contract.name}: its previews failed to load: ${(error as Error).message}`,
      })
      continue
    }
    const declared = slots.filter((slot) => slot.package === contract.name).map((slot) => slot.name)
    const problems = checkPreviews(module.previews, declared, contract.entries.previews)
    result.problems.push(
      ...problems.map(({ slot, reason }) => ({ slot, reason: `${contract.name} previews: ${reason}` })),
    )
    const previews = (module.previews || {}) as Record<string, { cases?: unknown }>
    if (typeof previews !== 'object') continue
    result.previews.push({
      package: contract.name,
      slots: Object.entries(previews)
        .filter(([name]) => declared.includes(name))
        .map(([name, preview]) => ({
          name,
          cases: Array.isArray(preview?.cases) ? preview.cases.length : 0,
        })),
    })
  }
  return result
}
