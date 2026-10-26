#!/usr/bin/env node
// ayon-addon: dev server and checks for AYON addon frontends. Every command prints JSON with --json.
//   ayon-addon dev [--port 5173]     watched build + server for AYON's dev override (?addonDev=)
//   ayon-addon slots [--json]        the slots of the installed @ynput/ayon-addon
//   ayon-addon check [--json] [--no-types]
import { createReadStream, existsSync, readdirSync, readFileSync, statSync } from 'fs'
import { createServer } from 'http'
import path from 'path'
import { checkAddon, formatCheck } from './check.js'
import { findConnection, findPackageDir, importFromProject, readAddonProject } from './project.js'

const argv = process.argv.slice(2)
const command = argv[0]
const flag = (name: string) => argv.includes(`--${name}`)
const option = (name: string, fallback?: string) => {
  const index = argv.indexOf(`--${name}`)
  return index >= 0 ? argv[index + 1] : fallback
}
const json = flag('json')
const print = (value: unknown, text: string) => console.log(json ? JSON.stringify(value, null, 2) : text)

const root = process.cwd()

const CONTENT_TYPES: Record<string, string> = {
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.map': 'application/json',
  '.html': 'text/html',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
}

// serves the build with CORS: AYON (any origin, also https) loads the remote from here
const serveDirectory = (dir: string, port: number) =>
  createServer((request, response) => {
    response.setHeader('Access-Control-Allow-Origin', '*')
    // agents' headless browsers send x-api-key on every request, which makes these preflighted
    response.setHeader('Access-Control-Allow-Headers', '*')
    response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.setHeader('Access-Control-Allow-Private-Network', 'true')
    response.setHeader('Cache-Control', 'no-store')
    if (request.method === 'OPTIONS') return void response.writeHead(204).end()
    const urlPath = decodeURIComponent((request.url || '/').split('?')[0])
    const file = path.join(dir, path.normalize(urlPath).replace(/^(\.\.[/\\])+/, ''))
    if (!file.startsWith(dir) || !existsSync(file) || !statSync(file).isFile()) {
      return void response.writeHead(404).end('not found')
    }
    response.writeHead(200, {
      'Content-Type': CONTENT_TYPES[path.extname(file)] || 'application/octet-stream',
    })
    createReadStream(file).pipe(response)
  }).listen(port)

// the build's dev info (dist/modules/<remote>/ayon-addon.json), written by ayonAddon()
const findDevInfo = () => {
  const modules = path.join(root, 'dist', 'modules')
  if (!existsSync(modules)) return undefined
  const file = readdirSync(modules)
    .map((name) => path.join(modules, name, 'ayon-addon.json'))
    .find((candidate) => existsSync(candidate))
  return file && { dir: path.dirname(file), info: JSON.parse(readFileSync(file, 'utf8')) }
}

const dev = async () => {
  const port = Number(option('port', '5173'))
  const project = readAddonProject(root)
  const vite = await importFromProject<typeof import('vite')>(root, 'vite')
  process.env.AYON_ADDON_DEV = '1'
  let served = false
  const watcher = (await vite.build({
    root,
    mode: 'development',
    build: { watch: {} },
    logLevel: 'warn',
  })) as unknown as {
    on: (event: 'event', listener: (e: { code: string; error?: Error }) => void) => void
  }
  watcher.on('event', (event) => {
    if (event.code === 'ERROR') console.error(event.error)
    if (event.code !== 'END') return
    const built = findDevInfo()
    if (!built) {
      console.error('no ayon-addon.json in dist/modules: is ayonAddon() in vite.config.ts?')
      return
    }
    if (served) {
      if (!json) console.log(`rebuilt (build ${built.info.buildId})`)
      return
    }
    served = true
    serveDirectory(built.dir, port)
    const url = `http://localhost:${port}`
    const open = `${findConnection(root).serverUrl}/?addonDev=${project.name}@${url}`
    print(
      { url, addon: project.name, remote: built.info.remote, buildId: built.info.buildId, open },
      [
        `${project.name} ${project.version}: built, serving ${url} (remote "${built.info.remote}")`,
        'Open AYON with this addon from here (developer mode on):',
        `  ${open}`,
        'The page reloads after every rebuild. ?addonDev=off goes back to the installed addon.',
      ].join('\n'),
    )
  })
}

const slots = async () => {
  const pkgDir = findPackageDir(root, '@ynput/ayon-addon')
  if (!pkgDir) throw new Error('@ynput/ayon-addon is not installed here')
  const data = JSON.parse(readFileSync(path.join(pkgDir, 'dist', 'slots.json'), 'utf8'))
  const text = [
    `@ynput/ayon-addon ${data.version}: ${data.slots.length} slots (details: node_modules/@ynput/ayon-addon/AGENTS.md)`,
    ...data.slots.map(
      (s: { name: string; helper: string; loads: string; where: string }) =>
        `  ${s.name.padEnd(30)} ${s.helper.padEnd(28)} ${s.loads.padEnd(18)} ${s.where}`,
    ),
  ].join('\n')
  print(data, text)
}

const check = async () => {
  const result = await checkAddon({ root, manifest: option('manifest'), types: !flag('no-types') })
  print(result, formatCheck(result))
  process.exitCode = result.ok ? 0 : 1
}

const HELP = `ayon-addon: tools for AYON addon frontends (run in the addon's frontend folder)

  dev [--port 5173]            build on every change and serve it for AYON's dev override:
                               open AYON with ?addonDev=<addon>@http://localhost:5173
  slots [--json]               the slots of the installed @ynput/ayon-addon
  check [--json] [--no-types]  the manifest as AYON reads it, the pieces' files, the types

Sign-in: AYON_SERVER_URL and AYON_API_KEY; in the AYON dev workbench, the local stack and
data/local-api-key.`

const commands: Record<string, () => Promise<void>> = { dev, slots, check }
const run = commands[command]
if (!run) {
  console.log(HELP)
  process.exitCode = command && command !== 'help' ? 1 : 0
} else {
  run().catch((error) => {
    console.error(json ? JSON.stringify({ ok: false, error: String(error) }) : error)
    process.exitCode = 1
  })
}
