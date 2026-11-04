// Slots of other addons: their contract packages (@ynput/ayon-addon-<addon>) mark themselves in
// their package.json with `"ayonAddon": { "slots": "./slots.js" }`, a plain JS module that exports
// the declarations as `slots`. `check` and `slots` read those of the addon's own dependencies.
import { readFileSync } from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'
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

const readJson = (file: string) => JSON.parse(readFileSync(file, 'utf8'))

export const readContractSlots = async (root: string): Promise<ContractSlots> => {
  const pkg = readJson(path.join(root, 'package.json'))
  const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
  const result: ContractSlots = { slots: [], problems: [] }

  for (const name of names) {
    const dir = findPackageDir(root, name)
    if (!dir) continue
    const entry = readJson(path.join(dir, 'package.json')).ayonAddon?.slots
    if (entry === undefined) continue
    try {
      if (typeof entry !== 'string') throw new Error('"ayonAddon.slots" must be a path')
      const module = await import(pathToFileURL(path.resolve(dir, entry)).href)
      if (!Array.isArray(module.slots)) throw new Error(`${entry} does not export a "slots" list`)
      result.slots.push(...module.slots.map((slot: ContractSlot) => ({ ...slot, package: name })))
    } catch (error) {
      result.problems.push({ reason: `${name}: its slots failed to load: ${(error as Error).message}` })
    }
  }
  return result
}
