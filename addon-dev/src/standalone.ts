// `ayon-addon dev` (the default): the Vite dev server (hot reload) with the dev shell from
// @ynput/ayon-addon-dev/shell instead of the addon's own index.html. AYON's requests go through
// the dev server to the real server, signed in with the API key; preview fixtures are read and
// written under dev/fixtures.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import type { IncomingMessage, ServerResponse } from 'http'
import path from 'path'
import { fileURLToPath } from 'url'
import type { Plugin, ProxyOptions } from 'vite'
import { findConnection, findPackageDir } from './project.js'
import type { AddonProject } from './project.js'

export const STANDALONE_ENV = 'AYON_ADDON_STANDALONE'
const ENTRY = '/@ayon-addon/shell-entry'
const VIRTUAL_ENTRY = '\0ayon-addon-shell-entry'
const FIXTURES_URL = '/__ayon-addon/fixtures'
// what AYON serves itself: proxied to the server
const PROXIED = ['/api', '/graphql', '/ws', '/addons', '/static', '/AYON.svg']
const SHARED = '@ynput/ayon-frontend-shared'
const DEDUPE = ['@tanstack/react-table']
// served from their source: one registry for the addon, the shell and the shared package
const LINKED = ['@ynput/ayon-addon', '@ynput/ayon-addon-dev']
// the built shell next to this file (dist/shell)
const SHELL_BUNDLE = fileURLToPath(new URL('./shell/index.js', import.meta.url))

interface StandaloneOptions {
  root: string
  project: AddonProject
  remote: string
  manifest: string
  fixtures: string
}

const HTML = (title: string) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" href="/AYON.svg" />
    <title>${title}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="${ENTRY}"></script>
  </body>
</html>
`

// the global styles AYON loads (src/index.tsx in ayon-frontend), from where the addon has them
const globalStyles = (root: string) => {
  const sharedDir = findPackageDir(root, SHARED)
  const candidates: [string, string][] = [
    ['@ynput/ayon-react-components', 'dist/style.css'],
    // the shared components' own styles (the context menu's)
    [SHARED, 'dist/style.css'],
    ['react-toastify', 'dist/ReactToastify.css'],
    ['primereact', 'resources/primereact.min.css'],
    ['primeicons', 'primeicons.css'],
  ]
  return candidates.flatMap(([pkg, file]) => {
    const dir = findPackageDir(root, pkg) || (sharedDir && findPackageDir(sharedDir, pkg))
    const css = dir && path.join(dir, file)
    return css && existsSync(css) ? [css] : []
  })
}

const packageOf = (id: string) => id.split('/').slice(0, id.startsWith('@') ? 2 : 1).join('/')

// the packages the shell imports (its bundle keeps every package import as is)
const shellImports = (root: string) => {
  if (!existsSync(SHELL_BUNDLE)) return []
  const bundle = readFileSync(SHELL_BUNDLE, 'utf8')
  const ids = [...bundle.matchAll(/^(?:import|export)\b[^'"]*["']([^'"./][^'"]*)["']/gm)].map((m) => m[1])
  return [...new Set(ids)].filter(
    (id) => !LINKED.includes(packageOf(id)) && !id.endsWith('.css') && findPackageDir(root, packageOf(id)),
  )
}

const sendJson = (res: ServerResponse, status: number, body: unknown) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

const readRequest = (req: IncomingMessage) =>
  new Promise<string>((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })

export const standalonePlugin = (options: StandaloneOptions): Plugin => {
  const { root, project, remote, fixtures } = options
  const fixturesDir = path.resolve(root, fixtures)
  const connection = findConnection(root)
  // relative to the root, as a path in the page and a glob for Vite's scan
  const manifest = path.posix.normalize(options.manifest).replace(/^\.?\//, '')

  return {
    name: 'ayon-addon:standalone',
    apply: (_config, { command }) => command === 'serve' && process.env[STANDALONE_ENV] === '1',

    config() {
      const headers: Record<string, string> = connection.apiKey ? { 'x-api-key': connection.apiKey } : {}
      const proxy: Record<string, ProxyOptions> = Object.fromEntries(
        PROXIED.map((prefix) => [
          prefix,
          { target: connection.serverUrl, changeOrigin: true, ws: prefix === '/ws', headers },
        ]),
      )
      const sharedDir = findPackageDir(root, SHARED)
      const sharedEntries = sharedDir
        ? Object.entries(
            JSON.parse(readFileSync(path.join(sharedDir, 'package.json'), 'utf8')).exports as Record<
              string,
              { import?: string }
            >,
          )
            // entries the package lists but doesn't ship
            .filter(([, entry]) => entry.import && existsSync(path.join(sharedDir, entry.import)))
            .map(([subpath]) => path.posix.join(SHARED, subpath))
        : []
      return {
        // the shell's page comes from the middleware below, not from index.html
        appType: 'custom',
        server: { proxy },
        resolve: { dedupe: DEDUPE.filter((pkg) => findPackageDir(root, pkg)) },
        optimizeDeps: {
          exclude: LINKED,
          // all known up front: a dependency found while the page loads re-optimizes and reloads
          // it. The addon's are found by scanning from its manifest (pieces are imports of it).
          include: [...new Set([...sharedEntries, ...shellImports(root)])],
          entries: [manifest],
        },
      }
    },

    resolveId(id) {
      if (id === ENTRY) return VIRTUAL_ENTRY
    },

    load(id) {
      if (id !== VIRTUAL_ENTRY) return
      const shellOptions = {
        addon: { name: project.name, version: project.version, remote },
        serverUrl: connection.serverUrl,
        signedInWithKey: !!connection.apiKey,
      }
      return [
        ...globalStyles(root).map((css) => `import ${JSON.stringify(css)}`),
        `import '@ynput/ayon-addon-dev/shell/style.css'`,
        `import manifest from ${JSON.stringify(`/${manifest}`)}`,
        `import { startShell } from '@ynput/ayon-addon-dev/shell'`,
        `startShell({ ...${JSON.stringify(shellOptions)}, manifest })`,
      ].join('\n')
    },

    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || '/', 'http://localhost')

        // preview fixtures: list, read, write (the developer panel's "Save")
        if (url.pathname === FIXTURES_URL) {
          const names = existsSync(fixturesDir)
            ? readdirSync(fixturesDir)
                .filter((file) => file.endsWith('.json'))
                .map((file) => file.replace(/\.json$/, ''))
            : []
          return sendJson(res, 200, names)
        }
        if (url.pathname.startsWith(`${FIXTURES_URL}/`)) {
          const name = decodeURIComponent(url.pathname.slice(FIXTURES_URL.length + 1))
          if (!/^[\w-]+$/.test(name)) return sendJson(res, 400, { detail: 'fixture names: letters, digits, - and _' })
          const file = path.join(fixturesDir, `${name}.json`)
          if (req.method === 'POST') {
            const body = await readRequest(req)
            try {
              JSON.parse(body)
            } catch {
              return sendJson(res, 400, { detail: 'not JSON' })
            }
            mkdirSync(fixturesDir, { recursive: true })
            writeFileSync(file, body.endsWith('\n') ? body : `${body}\n`)
            return sendJson(res, 200, { saved: path.relative(root, file) })
          }
          if (!existsSync(file)) return sendJson(res, 404, { detail: `no ${path.relative(root, file)}` })
          res.setHeader('Content-Type', 'application/json')
          return res.end(readFileSync(file))
        }

        // the shell's page, for every navigation that isn't AYON's
        const isPage =
          req.method === 'GET' &&
          req.headers.accept?.includes('text/html') &&
          !PROXIED.some((prefix) => url.pathname.startsWith(prefix)) &&
          !url.pathname.startsWith('/@') &&
          !url.pathname.startsWith('/__')
        if (!isPage) return next()
        const html = await server.transformIndexHtml(req.url || '/', HTML(`${project.name} (AYON dev shell)`))
        res.setHeader('Content-Type', 'text/html')
        res.end(html)
      })
    },
  }
}
