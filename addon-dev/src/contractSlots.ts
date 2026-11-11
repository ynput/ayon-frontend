// Slots of other addons: their contract packages (@ynput/ayon-addon-<addon>) mark themselves in
// their package.json with `"ayonAddon": { "slots": "./slots.js", "previews": "./previews.js" }`.
// `slots` is a plain JS module that exports the declarations as `slots`; `previews` (optional) one
// that exports `previews`, the scenes the dev shell renders the slots in (contractPreviews.ts).
// `check` and `slots` read those of the addon's own dependencies, the dev shell imports them.
import { readFileSync, realpathSync } from 'fs'
import { createRequire } from 'module'
import path from 'path'
import { pathToFileURL } from 'url'
import { checkPreviews, validScenes } from './contractPreviews.js'
import { findPackageDir, importFromProject } from './project.js'

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
  /** per contract package with previews: its scenes, and the slots each renders */
  previews: { package: string; scenes: { id: string; label: string; slots: string[] }[] }[]
  problems: { reason: string }[]
}

// what a previews module gets for `@ynput/ayon-addon` in Node: the SDK needs a browser (and its
// CommonJS dependencies don't load as ES modules), the scenes only use it when they render
const SDK_STAND_IN = new Proxy({}, { get: (_target, key) => (key === '__esModule' ? true : undefined) })

/**
 * A previews module in Node, for `ayon-addon check`: bundled with Vite (its own relative imports
 * included) to CommonJS, and run with `provided` for the packages named there (by default a
 * stand-in for `@ynput/ayon-addon` and its entries). Other packages are required from where the
 * module is, else from the addon.
 */
export const loadPreviewsModule = async (
  root: string,
  file: string,
  provided: Record<string, unknown> = { '@ynput/ayon-addon': SDK_STAND_IN },
): Promise<{ previews?: unknown }> => {
  const vite = await importFromProject<typeof import('vite')>(root, 'vite')
  const isPackage = (id: string) => !id.startsWith('.') && !path.isAbsolute(id) && !id.startsWith('\0')
  const output = await vite.build({
    root: path.dirname(file),
    configFile: false,
    logLevel: 'silent',
    build: {
      ssr: file,
      write: false,
      minify: false,
      rollupOptions: { external: isPackage, output: { format: 'cjs', exports: 'named' } },
    },
  })
  const outputs = (Array.isArray(output) ? output : [output]) as {
    output: { type: string; isEntry?: boolean; code?: string }[]
  }[]
  const code = outputs.flatMap((o) => o.output).find((chunk) => chunk.type === 'chunk' && chunk.isEntry)?.code
  if (code === undefined) throw new Error(`could not build ${file}`)
  const fromModule = createRequire(file)
  const fromAddon = createRequire(path.join(root, 'package.json'))
  const require = (id: string) => {
    const name = Object.keys(provided).find((pkg) => id === pkg || id.startsWith(`${pkg}/`))
    if (name) return provided[name]
    try {
      return fromModule(id)
    } catch {
      return fromAddon(id)
    }
  }
  const module = { exports: {} as Record<string, unknown> }
  new Function('require', 'module', 'exports', code)(require, module, module.exports)
  return module.exports
}

/** The previews of the contract packages, checked against the slots each one declares. */
export const readContractPreviews = async (
  root: string,
  slots: readonly ContractSlot[],
): Promise<ContractPreviews> => {
  const result: ContractPreviews = { previews: [], problems: [] }
  for (const contract of findContractPackages(root).packages) {
    if (!contract.previews) continue
    let module: { previews?: unknown }
    try {
      module = await loadPreviewsModule(root, contract.previews)
    } catch (error) {
      result.problems.push({
        reason: `${contract.name}: its previews failed to load: ${(error as Error).message}`,
      })
      continue
    }
    const declared = slots.filter((slot) => slot.package === contract.name).map((slot) => slot.name)
    const problems = checkPreviews(module.previews, declared, contract.entries.previews)
    result.problems.push(
      ...problems.map(({ scene, reason }) => ({
        reason: `${contract.name} previews${scene ? `, ${scene}` : ''}: ${reason}`,
      })),
    )
    result.previews.push({
      package: contract.name,
      scenes: validScenes(module.previews, declared).map(({ id, label, slots: rendered }) => ({
        id,
        label,
        slots: rendered,
      })),
    })
  }
  return result
}
