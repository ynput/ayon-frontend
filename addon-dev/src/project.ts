// What the tools need to know about the addon they run in: its name and version (package.py),
// where AYON runs, and how to sign in to it.
import { existsSync, readFileSync } from 'fs'
import { createRequire } from 'module'
import path from 'path'
import { pathToFileURL } from 'url'

export interface AddonProject {
  /** the frontend folder (where package.json and vite.config.ts are) */
  root: string
  /** addon name and version from the addon's package.py (one folder up), else package.json */
  name: string
  version: string
}

const pyString = (source: string, key: string) =>
  source.match(new RegExp(`^${key}\\s*=\\s*["']([^"']+)["']`, 'm'))?.[1]

export const readAddonProject = (root = process.cwd()): AddonProject => {
  const packagePy = path.resolve(root, '..', 'package.py')
  if (existsSync(packagePy)) {
    const source = readFileSync(packagePy, 'utf8')
    const name = pyString(source, 'name')
    const version = pyString(source, 'version')
    if (name && version) return { root, name, version }
  }
  const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))
  return { root, name: pkg.name, version: pkg.version }
}

// the AYON dev workbench keeps the local stack's service key in data/local-api-key
const findWorkbench = (from: string): string | undefined => {
  let dir = path.resolve(from)
  while (dir !== path.dirname(dir)) {
    if (existsSync(path.join(dir, 'data', 'local-api-key')) && existsSync(path.join(dir, 'mani.yaml')))
      return dir
    dir = path.dirname(dir)
  }
  return undefined
}

const workbenchServerPort = (workbench: string) => {
  const env = path.join(workbench, '.env')
  const port = existsSync(env) && readFileSync(env, 'utf8').match(/^SERVER_PORT=(\d+)/m)?.[1]
  return port || '5100'
}

export interface AyonConnection {
  serverUrl: string
  /** sent as x-api-key: the app runs as that (service) user, without a login page */
  apiKey?: string
  /** where the key came from, for messages */
  apiKeySource?: string
}

/**
 * AYON_SERVER_URL and AYON_API_KEY win; inside the AYON dev workbench the local stack and its
 * key (data/local-api-key) are the defaults.
 */
export const findConnection = (root = process.cwd()): AyonConnection => {
  const workbench = findWorkbench(root)
  const serverUrl =
    process.env.AYON_SERVER_URL ||
    process.env.SERVER_URL ||
    (workbench ? `http://localhost:${workbenchServerPort(workbench)}` : 'http://localhost:5000')
  if (process.env.AYON_API_KEY) {
    return { serverUrl, apiKey: process.env.AYON_API_KEY, apiKeySource: 'AYON_API_KEY' }
  }
  // another server named explicitly: never send it the local stack's key
  if (workbench && !process.env.AYON_SERVER_URL && !process.env.SERVER_URL) {
    const keyFile = path.join(workbench, 'data', 'local-api-key')
    return { serverUrl, apiKey: readFileSync(keyFile, 'utf8').trim(), apiKeySource: keyFile }
  }
  return { serverUrl }
}

/**
 * Imports a package the way the addon resolves it, not from where this file lives: a linked
 * @ynput/ayon-addon-dev would otherwise use the ayon-frontend checkout's copies.
 */
export const importFromProject = async <T>(root: string, specifier: string): Promise<T> => {
  const require = createRequire(path.join(root, 'package.json'))
  let resolved: string
  try {
    resolved = require.resolve(specifier)
  } catch {
    // ESM-only packages: read their package.json
    const [scope, name, ...rest] = specifier.split('/')
    const pkgName = scope.startsWith('@') ? `${scope}/${name}` : scope
    const sub = (scope.startsWith('@') ? rest : [name, ...rest]).filter(Boolean).join('/')
    let dir = root
    while (!existsSync(path.join(dir, 'node_modules', pkgName, 'package.json'))) {
      if (dir === path.dirname(dir)) throw new Error(`${specifier} is not installed in ${root}`)
      dir = path.dirname(dir)
    }
    const pkgDir = path.join(dir, 'node_modules', pkgName)
    const pkg = JSON.parse(readFileSync(path.join(pkgDir, 'package.json'), 'utf8'))
    const entry = pkg.exports?.[sub ? `./${sub}` : '.']
    const target = typeof entry === 'string' ? entry : entry?.import ?? entry?.default ?? pkg.module ?? pkg.main
    resolved = path.join(pkgDir, target)
  }
  return import(pathToFileURL(resolved).href) as Promise<T>
}

/** Where a package is installed for the addon (node_modules lookup, no exports needed). */
export const findPackageDir = (root: string, pkgName: string): string | undefined => {
  let dir = root
  while (dir !== path.dirname(dir)) {
    const candidate = path.join(dir, 'node_modules', pkgName)
    if (existsSync(path.join(candidate, 'package.json'))) return candidate
    dir = path.dirname(dir)
  }
  return undefined
}

export const installedVersion = (root: string, pkgName: string): string | undefined => {
  const dir = findPackageDir(root, pkgName)
  return dir && JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8')).version
}
