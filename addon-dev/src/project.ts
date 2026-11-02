// What the tools need to know about the addon they run in: its name and version (package.py),
// where AYON runs, and how to sign in to it.
import { spawnSync } from 'child_process'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { createRequire } from 'module'
import path from 'path'
import { createInterface } from 'readline/promises'
import { Writable } from 'stream'
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

export const DEFAULT_SERVER_URL = 'http://localhost:5000'

/**
 * AYON_SERVER_URL and AYON_API_KEY win; inside the AYON dev workbench the local stack and its
 * key (data/local-api-key) are the defaults.
 */
export const findConnection = (root = process.cwd()): AyonConnection => {
  const workbench = findWorkbench(root)
  const serverUrl =
    process.env.AYON_SERVER_URL ||
    process.env.SERVER_URL ||
    (workbench ? `http://localhost:${workbenchServerPort(workbench)}` : DEFAULT_SERVER_URL)
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

// the .env that requireApiKey writes: the server, and the key when the user gave one
export const envFileContents = (serverUrl: string, apiKey = '') => `# ayon-addon: the AYON server and an API key for this addon's tools.
# Every ayon-addon command reads this file. A variable set in your shell wins over it, and
# .env.local (same format) wins over this file. Keep both out of git.

# The AYON server
AYON_SERVER_URL=${serverUrl}

# A service user's key: Settings → Users → Add Service User → Generate new key.
# AYON shows the key once, so copy it here.
AYON_API_KEY=${apiKey}
`

/** The server address as typed (without trailing slashes), or undefined when it isn't http(s) */
export const parseServerUrl = (answer: string) => {
  const address = answer.trim().replace(/\/+$/, '')
  try {
    const { protocol } = new URL(address)
    return protocol === 'http:' || protocol === 'https:' ? address : undefined
  } catch {
    return undefined
  }
}

// The setup's questions in one line reader that stays open, so answers typed ahead are not lost
// between questions. A secret is typed without echo: the reader's output is muted while it's read.
const openTerminal = () => {
  let muted = false
  const output = new Writable({
    write: (chunk, _encoding, done) => {
      if (!muted) process.stdout.write(chunk)
      done()
    },
  })
  const rl = createInterface({ input: process.stdin, output, terminal: true })
  return {
    ask: async (question: string, secret = false): Promise<string> => {
      if (secret) {
        process.stdout.write(question)
        muted = true
      }
      const answer = await rl.question(secret ? '' : question)
      if (secret) {
        muted = false
        process.stdout.write('\n')
      }
      return answer.trim()
    },
    close: () => rl.close(),
  }
}

/** What to do when no API key is set: which file to put it in, and where to get the key */
export const keySetupMessage = (root: string) => {
  const files = ENV_FILES.map((name) => path.join(root, name)).filter((file) => existsSync(file))
  const key =
    "Set AYON_API_KEY to a service user's key: Settings → Users → Add Service User → Generate new key (AYON shows it once)."
  const file = path.join(root, '.env')
  return files.length
    ? `no API key: AYON_API_KEY is not set in ${files.join(' or ')} or in the shell. ${key}`
    : `no API key: AYON_API_KEY is not set in the shell or in ${file}. ${key} Set AYON_SERVER_URL too if the server isn't ${DEFAULT_SERVER_URL}. Or run this command in a terminal and ayon-addon asks for them and writes ${file}.`
}

/**
 * Returns the API key, or stops the command when there is none. In a terminal with no env file
 * yet, it walks through writing one: the server (default http://localhost:5000), then the key,
 * which can be left empty to add later. A key given there lets the command go on.
 */
export const requireApiKey = async (
  root: string,
  apiKey: string | undefined,
  interactive: boolean,
): Promise<string> => {
  if (apiKey) return apiKey
  const file = path.join(root, '.env')
  const hasEnvFile = ENV_FILES.some((name) => existsSync(path.join(root, name)))
  if (!interactive || hasEnvFile) throw new Error(keySetupMessage(root))

  const terminal = openTerminal()
  try {
    if (/^n/i.test(await terminal.ask(`no API key yet. Set up ${file}? [Y/n] `))) {
      throw new Error(keySetupMessage(root))
    }
    let serverUrl: string | undefined
    while (!serverUrl) {
      const answer = await terminal.ask(`AYON server [${DEFAULT_SERVER_URL}]: `)
      serverUrl = parseServerUrl(answer || DEFAULT_SERVER_URL)
      if (!serverUrl) console.log('start the address with http:// or https://')
    }
    const key = await terminal.ask(
      'AYON API key (Settings → Users → Add Service User → Generate new key), or Enter to add it later: ',
      true,
    )
    writeFileSync(file, envFileContents(serverUrl, key))
    // git check-ignore: 1 means git doesn't ignore the file (0 ignored, 128 not a repo)
    const ignored = spawnSync('git', ['check-ignore', '-q', file], { cwd: root }).status !== 1
    const warning = ignored ? '' : '. It is not git-ignored: add .env to .gitignore before you commit'
    if (!key) {
      throw new Error(
        `created ${file} with ${serverUrl}: add AYON_API_KEY there, then run the command again${warning}`,
      )
    }
    console.log(`created ${file}${warning}`)
    process.env.AYON_SERVER_URL = serverUrl
    process.env.AYON_API_KEY = key
    return key
  } finally {
    terminal.close()
  }
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
