// `ayon-addon check`: the manifest the way AYON reads it (slots, ids, fields, pieces), that every
// piece's file exists, and the addon's types.
import { spawnSync } from 'child_process'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { createRequire } from 'module'
import path from 'path'
import { pathToFileURL } from 'url'
import { readContractPreviews, readContractSlots } from './contractSlots.js'
import { importFromProject, installedVersion, readAddonProject } from './project.js'

export interface CheckResult {
  ok: boolean
  addon: { name: string; version: string }
  manifest: string
  sdkVersion?: string
  /** slots this addon declares */
  declares: { name: string; version: number }[]
  /** slots it can contribute to from its contract packages */
  contractSlots: { name: string; version: number; package: string }[]
  /** the scenes the dev shell renders those slots in, per contract package with previews */
  contractPreviews: { package: string; scenes: { id: string; label: string; slots: string[] }[] }[]
  contributions: { slot: string; id: string; key: string; pieces: Record<string, string | null> }[]
  problems: { slot?: string; id?: string; reason: string }[]
  /**
   * worth knowing, not a failure: contributions no preview scene renders, a `minExposureLevel`
   * between AYON's levels
   */
  notes: { slot?: string; id?: string; reason: string }[]
  types?: { ok: boolean; errors: string[] }
}

// the part of @ynput/ayon-addon/check used here (the addon's installed version is the one that counts)
interface SlotPieces {
  pieces: readonly string[]
  optionalPieces?: readonly string[]
  owner?: { name: string }
}
interface CheckModule {
  SLOTS: Record<string, SlotPieces>
  // older versions of the package have no exposure levels
  EXPOSURE?: Record<string, number>
  // older versions of the package have no declarations
  checkSlotDeclarations?: (
    addon: { name: string; version: string; remote: string },
    manifest: unknown,
  ) => {
    slots: ({ name: string; version: number } & SlotPieces)[]
    skipped: { slot?: string; reason: string }[]
  }
  checkManifest: (
    addon: { name: string; version: string; remote: string },
    manifest: unknown,
    slots?: Record<string, SlotPieces>,
  ) => {
    contributions: ({ slot: string; id: string; key: string } & Record<string, unknown>)[]
    skipped: { slot?: string; id?: string; reason: string }[]
  }
}

/**
 * A note for a `minExposureLevel` that is none of AYON's levels (`EXPOSURE`): it works, but is
 * likely a typo. `checkManifest` already skips one that is not a whole number in range.
 */
export const exposureNote = (level: unknown, levels: Record<string, number> | undefined) => {
  if (typeof level !== 'number' || !levels || Object.values(levels).includes(level)) return
  const known = Object.entries(levels).map(([role, value]) => `${role} ${value}`)
  return `minExposureLevel ${level} is none of AYON's levels (${known.join(', ')}): use EXPOSURE.<role>`
}

const EXTENSIONS = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js']

// a piece is `() => import('./File')`: find the file it imports
const pieceFile = (root: string, manifestDir: string, piece: unknown): string | null | undefined => {
  if (typeof piece !== 'function') return undefined
  const specifier = String(piece).match(/import\(\s*["'`]([^"'`]+)["'`]\s*\)/)?.[1]
  if (!specifier) return null
  const base = specifier.startsWith('@/')
    ? path.join(root, 'src', specifier.slice(2))
    : path.resolve(manifestDir, specifier)
  const found = EXTENSIONS.map((ext) => base + ext).find((file) => existsSync(file))
  return found ? path.relative(root, found) : `missing: ${specifier}`
}

// bundles the manifest without its pieces (dynamic imports stay imports) and imports it
const loadManifest = async (root: string, manifestPath: string) => {
  const vite = await importFromProject<typeof import('vite')>(root, 'vite')
  const output = await vite.build({
    root,
    configFile: false,
    logLevel: 'silent',
    resolve: { alias: { '@': path.join(root, 'src') } },
    plugins: [
      {
        name: 'ayon-addon:check',
        resolveDynamicImport: (specifier) =>
          typeof specifier === 'string' ? { id: specifier, external: true } : null,
      },
    ],
    build: { ssr: manifestPath, write: false, minify: false, rollupOptions: { output: { format: 'es' } } },
  })
  const outputs = (Array.isArray(output) ? output : [output]) as { output: { type: string; isEntry?: boolean; code?: string }[] }[]
  const entry = outputs.flatMap((o) => o.output).find((chunk) => chunk.type === 'chunk' && chunk.isEntry)
  if (!entry?.code) throw new Error(`could not build ${manifestPath}`)
  const dir = path.join(root, 'node_modules', '.ayon-addon')
  mkdirSync(dir, { recursive: true })
  const file = path.join(dir, 'manifest-check.mjs')
  writeFileSync(file, entry.code)
  const module = await import(`${pathToFileURL(file).href}?t=${Date.now()}`)
  return module.default as unknown
}

const typeCheck = (root: string) => {
  const require = createRequire(path.join(root, 'package.json'))
  const tsc = require.resolve('typescript/bin/tsc')
  const result = spawnSync(process.execPath, [tsc, '--noEmit', '-p', path.join(root, 'tsconfig.json')], {
    cwd: root,
    encoding: 'utf8',
  })
  const errors = `${result.stdout}${result.stderr}`
    .split('\n')
    .filter((line) => / error TS\d+/.test(line))
  return { ok: result.status === 0, errors }
}

export const checkAddon = async ({
  root = process.cwd(),
  manifest = 'src/manifest.ts',
  types = true,
}: { root?: string; manifest?: string; types?: boolean } = {}): Promise<CheckResult> => {
  const project = readAddonProject(root)
  const manifestPath = path.resolve(root, manifest)
  const result: CheckResult = {
    ok: true,
    addon: { name: project.name, version: project.version },
    manifest,
    declares: [],
    contractSlots: [],
    contractPreviews: [],
    contributions: [],
    problems: [],
    notes: [],
  }
  const sdk = await importFromProject<CheckModule>(root, '@ynput/ayon-addon/check')
  result.sdkVersion = installedVersion(root, '@ynput/ayon-addon')

  let loaded: unknown
  try {
    loaded = await loadManifest(root, manifestPath)
  } catch (error) {
    result.problems.push({ reason: `the manifest failed to load: ${(error as Error).message}` })
  }
  const contract = await readContractSlots(root)
  result.problems.push(...contract.problems)
  result.contractSlots = contract.slots.map(({ name, version, package: from }) => ({
    name,
    version,
    package: from,
  }))
  const previews = await readContractPreviews(root, contract.slots)
  result.contractPreviews = previews.previews
  result.problems.push(...previews.problems)
  if (loaded !== undefined) {
    const info = { name: project.name, version: project.version, remote: 'check' }
    const own = sdk.checkSlotDeclarations?.(info, loaded)
    result.declares = (own?.slots || []).map(({ name, version }) => ({ name, version }))
    result.problems.push(...(own?.skipped || []).map(({ slot, reason }) => ({ slot, reason })))
    const slots: Record<string, SlotPieces> = {
      ...sdk.SLOTS,
      // the owner names the addon to update in a slot version problem
      ...Object.fromEntries(
        contract.slots.map((slot) => [slot.name, { ...slot, owner: { name: slot.name.split('.')[0] } }]),
      ),
      ...Object.fromEntries((own?.slots || []).map((slot) => [slot.name, slot])),
    }
    const { contributions, skipped } = sdk.checkManifest(info, loaded, slots)
    result.problems.push(...skipped.map(({ slot, id, reason }) => ({ slot, id, reason })))
    for (const contribution of contributions) {
      const definition = slots[contribution.slot]
      const pieceNames = [...definition.pieces, ...(definition.optionalPieces || [])]
      const pieces: Record<string, string | null> = {}
      for (const name of pieceNames) {
        const file = pieceFile(root, path.dirname(manifestPath), contribution[name])
        if (file === undefined) continue
        pieces[name] = file
        if (file?.startsWith('missing:')) {
          result.problems.push({ slot: contribution.slot, id: contribution.id, reason: `${name}: ${file}` })
        }
      }
      result.contributions.push({ slot: contribution.slot, id: contribution.id, key: contribution.key, pieces })
      const exposure = exposureNote(contribution.minExposureLevel, sdk.EXPOSURE)
      if (exposure) result.notes.push({ slot: contribution.slot, id: contribution.id, reason: exposure })
      const from = contract.slots.find((slot) => slot.name === contribution.slot)?.package
      const scenes = result.contractPreviews.find((p) => p.package === from)?.scenes || []
      if (from && !scenes.some((scene) => scene.slots.includes(contribution.slot))) {
        result.notes.push({
          slot: contribution.slot,
          id: contribution.id,
          reason: `no preview scene in ${from} renders ${contribution.slot}`,
        })
      }
    }
  }
  if (types) result.types = typeCheck(root)
  result.ok = !result.problems.length && result.types?.ok !== false
  return result
}

export const formatCheck = (result: CheckResult) => {
  const lines = [
    `${result.addon.name} ${result.addon.version}, ${result.manifest} (@ynput/ayon-addon ${result.sdkVersion})`,
    ...result.declares.map((s) => `  ok  ${s.name.padEnd(30)} declares this slot, version ${s.version}`),
    ...result.contractPreviews.flatMap((p) =>
      p.scenes.length
        ? p.scenes.map(
            (scene) => `  ok  ${`${p.package} previews`.padEnd(30)} ${scene.id.padEnd(24)} ${scene.slots.join(', ')}`,
          )
        : [`  ok  ${`${p.package} previews`.padEnd(30)} ${'no scenes'.padEnd(24)}`],
    ),
    ...result.contributions.map(
      (c) => `  ok  ${c.slot.padEnd(30)} ${c.id.padEnd(24)} ${Object.values(c.pieces).filter(Boolean).join(', ')}`,
    ),
    ...result.notes.map((n) => `  --  ${(n.slot || '').padEnd(30)} ${(n.id || '').padEnd(24)} ${n.reason}`),
    ...result.problems.map((p) => `  !!  ${(p.slot || '').padEnd(30)} ${(p.id || '').padEnd(24)} ${p.reason}`),
  ]
  if (result.types) {
    lines.push(result.types.ok ? '  ok  types' : `  !!  types: ${result.types.errors.length} errors`)
    lines.push(...result.types.errors.slice(0, 20).map((e) => `      ${e}`))
  }
  lines.push(result.ok ? 'check passed' : 'check failed')
  return lines.join('\n')
}
