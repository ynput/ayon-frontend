// What the tools need to know about the addon they run in: its name and version (package.py),
// where AYON runs, and how to sign in to it.
import { spawnSync } from 'child_process'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { createRequire } from 'module'
import path from 'path'
import { createInterface } from 'readline/promises'
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

// the addon's env files, in order: the first one that sets a variable wins, and the shell wins over both
const ENV_FILES = ['.env.local', '.env']

/**
 * Loads the addon's `.env.local` and `.env` (AYON_SERVER_URL, AYON_API_KEY, …) into process.env,
 * so no command needs an `--env-file` or a shell export.
 */
export const loadProjectEnv = (root = process.cwd()) => {
  for (const name of ENV_FILES) {
    const file = path.join(root, name)
    if (existsSync(file)) process.loadEnvFile(file)
  }
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

// written to .env by requireApiKey: the settings, and where the key comes from
export const ENV_TEMPLATE = `# ayon-addon: the AYON server and an API key for this addon's tools.
# Every ayon-addon command reads this file. A variable set in your shell wins over it, and
# .env.local (same format) wins over this file. Keep both out of git.

# The AYON server, when it isn't the local stack (http://localhost:5000 outside the AYON dev workbench)
AYON_SERVER_URL=

# A service user's key: Settings → Users → Add Service User → Generate new key.
# AYON shows the key once, so copy it here.
AYON_API_KEY=
`

/** What to do when no API key is set: which file to put it in, and where to get the key */
export const keySetupMessage = (root: string) => {
  const files = ENV_FILES.map((name) => path.join(root, name)).filter((file) => existsSync(file))
  const key =
    "Set AYON_API_KEY to a service user's key: Settings → Users → Add Service User → Generate new key (AYON shows it once)."
  const file = path.join(root, '.env')
  return files.length
    ? `no API key: AYON_API_KEY is not set in ${files.join(' or ')} or in the shell. ${key}`
    : `no API key: AYON_API_KEY is not set in the shell or in ${file}. ${key} Set AYON_SERVER_URL too if the server isn't http://localhost:5000. Or run this command in a terminal and ayon-addon writes ${file} for you.`
}

/**
 * Returns the API key, or stops the command when there is none. In a terminal, with no env file
 * yet, it first offers to write the template: the key still has to be filled in, so it stops.
 */
export const requireApiKey = async (
  root: string,
  apiKey: string | undefined,
  interactive: boolean,
): Promise<string> => {
  if (apiKey) return apiKey
  const file = path.join(root, '.env')
  const hasEnvFile = ENV_FILES.some((name) => existsSync(path.join(root, name)))
  if (interactive && !hasEnvFile) {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    const answer = await rl.question(`no API key yet. Create ${file} with the settings? [y/N] `)
    rl.close()
    if (/^y(es)?$/i.test(answer.trim())) {
      writeFileSync(file, ENV_TEMPLATE)
      // git check-ignore: 1 means git doesn't ignore the file (0 ignored, 128 not a repo)
      const ignored = spawnSync('git', ['check-ignore', '-q', file], { cwd: root }).status !== 1
      throw new Error(
        `created ${file}: set AYON_API_KEY in it, then run the command again` +
          (ignored ? '' : '. It is not git-ignored: add .env to .gitignore before you commit'),
      )
    }
  }
  throw new Error(keySetupMessage(root))
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
