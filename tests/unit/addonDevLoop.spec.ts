import { expect, test } from '@playwright/test'
import { mkdirSync, mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import {
  addonDevInfoProblem,
  addonDevUserProblem,
  fetchAddonDevInfo,
  parseAddonDevParam,
} from '../../shared/src/context/remote-modules/addonDevOverride'
import { checkDevRequirements } from '../../addon-dev/src/devChecks'

// The host side of ?addonDev=: every way the override can be refused has a reason the banner shows.

test('a local dev server URL is an override', () => {
  expect(parseAddonDevParam('timetracker@http://localhost:5173/')).toEqual({
    override: { addon: 'timetracker', url: 'http://localhost:5173' },
  })
  expect(parseAddonDevParam('a@http://[::1]:5173')).toHaveProperty('override')
  expect(parseAddonDevParam('a@http://127.0.0.1:5173')).toHaveProperty('override')
})

test('a malformed or non-local override says why', () => {
  const reason = (value: string) => {
    const request = parseAddonDevParam(value)
    return 'reason' in request ? request.reason : null
  }
  expect(reason('http://localhost:5173')).toContain('<addon>@http://localhost')
  expect(reason('@http://localhost:5173')).toContain('<addon>@http://localhost')
  expect(reason('a@nope')).toContain('is not a URL')
  expect(reason('a@ftp://localhost:5173')).toContain('http(s)')
  expect(reason('a@http://192.168.1.4:5173')).toContain('192.168.1.4 is not this machine')
  expect(reason('a@https://evil.example.com')).toContain('evil.example.com is not this machine')
})

test('only developer-mode and service users may use the override', () => {
  expect(addonDevUserProblem({ attrib: { developerMode: true } })).toBeNull()
  expect(addonDevUserProblem({ data: { isService: true } })).toBeNull()
  expect(addonDevUserProblem({ data: { isDeveloper: true } })).toContain('turn on Developer Mode')
  expect(addonDevUserProblem({ attrib: {}, data: {} })).toContain('not a developer')
})

const override = { addon: 'timetracker', url: 'http://localhost:5173' }
const info = { name: 'timetracker', version: '0.1.0', remote: 'timetracker', modules: ['manifest'], buildId: 'x' }

test('/ayon-addon.json must be complete and name the requested addon', () => {
  expect(addonDevInfoProblem(info, override)).toBeNull()
  expect(addonDevInfoProblem({ ...info, buildId: undefined }, override)).toContain('invalid (no buildId)')
  expect(addonDevInfoProblem({ name: 'timetracker' }, override)).toContain('no version, remote, buildId, modules')
  expect(addonDevInfoProblem('html', override)).toContain('invalid')
  expect(addonDevInfoProblem({ ...info, name: 'other' }, override)).toContain(
    'serves "other", not "timetracker": open ?addonDev=other@http://localhost:5173',
  )
})

test('a dev server that is down, not the CLI, or serves something else says why', async () => {
  const realFetch = globalThis.fetch
  const answer = (response: () => Promise<Response>) => (globalThis.fetch = response as typeof fetch)
  try {
    answer(() => Promise.reject(new TypeError('Failed to fetch')))
    await expect(fetchAddonDevInfo(override)).rejects.toThrow('no answer from http://localhost:5173')
    answer(async () => new Response('not found', { status: 404 }))
    await expect(fetchAddonDevInfo(override)).rejects.toThrow('has no /ayon-addon.json')
    answer(async () => new Response('<html>', { status: 200 }))
    await expect(fetchAddonDevInfo(override)).rejects.toThrow('is not JSON')
    answer(async () => Response.json({ ...info, name: 'other' }))
    await expect(fetchAddonDevInfo(override)).rejects.toThrow('serves "other"')
    answer(async () => Response.json(info))
    await expect(fetchAddonDevInfo(override)).resolves.toEqual(info)
  } finally {
    globalThis.fetch = realFetch
  }
})

// The CLI side: `ayon-addon dev --ayon` checks what it can against the server.

const makeProject = (version: string, { server = true, frontendVersion = version } = {}) => {
  const addonDir = mkdtempSync(path.join(tmpdir(), 'ayon-addon-dev-'))
  const root = path.join(addonDir, 'frontend')
  mkdirSync(path.join(root, 'src'), { recursive: true })
  if (server) mkdirSync(path.join(addonDir, 'server'))
  writeFileSync(path.join(root, 'src', 'addonVersion.ts'), `export default "${frontendVersion}";\n`)
  return { root, name: 'timetracker', version }
}

type Answers = Record<string, unknown | number>
const fakeServer = (answers: Answers) =>
  (async (url: string) => {
    const answer = answers[new URL(url).pathname]
    if (answer === undefined) throw new TypeError('fetch failed')
    if (typeof answer === 'number') return new Response('', { status: answer })
    return Response.json(answer)
  }) as typeof fetch

const connection = { serverUrl: 'http://localhost:5100', apiKey: 'key', apiKeySource: 'data/local-api-key' }
const serviceUser = { name: 'workbench', attrib: {}, data: { isService: true } }
const installed = (versions: Record<string, object>) => ({ addons: [{ name: 'timetracker', versions }] })
const summary = (checks: { id: string; ok: boolean; severity?: string }[]) =>
  checks.map((check) => `${check.id}:${check.ok ? 'ok' : check.severity}`)

test('everything in place passes', async () => {
  const checks = await checkDevRequirements({
    project: makeProject('0.1.0'),
    connection,
    fetch: fakeServer({
      '/api/info': { version: '1.14.0' },
      '/api/users/me': serviceUser,
      '/api/addons': installed({ '0.1.0': {} }),
    }),
  })
  expect(summary(checks)).toEqual(['server:ok', 'user:ok', 'addon:ok'])
})

test('a server that does not answer stops the checks', async () => {
  const checks = await checkDevRequirements({ project: makeProject('0.1.0'), connection, fetch: fakeServer({}) })
  expect(summary(checks)).toEqual(['server:error'])
  expect(checks[0].fix).toContain('AYON_SERVER_URL')
})

test('without an API key only the server is checked', async () => {
  const checks = await checkDevRequirements({
    project: makeProject('0.1.0'),
    connection: { serverUrl: connection.serverUrl },
    fetch: fakeServer({ '/api/info': {} }),
  })
  expect(summary(checks)).toEqual(['server:ok', 'apiKey:warning'])
})

test('a rejected key and a user without developer mode are reported', async () => {
  const project = makeProject('0.1.0')
  const rejected = await checkDevRequirements({
    project,
    connection,
    fetch: fakeServer({ '/api/info': {}, '/api/users/me': 401 }),
  })
  expect(summary(rejected)).toEqual(['server:ok', 'user:error'])

  const plainUser = await checkDevRequirements({
    project,
    connection,
    fetch: fakeServer({
      '/api/info': {},
      '/api/users/me': { name: 'artist', attrib: { developerMode: false }, data: {} },
      '/api/addons': installed({ '0.1.0': {} }),
    }),
  })
  expect(summary(plainUser)).toEqual(['server:ok', 'user:warning', 'addon:ok'])
})

test('the addon missing on the server, or in the version the frontend calls, fails', async () => {
  const answers = { '/api/info': {}, '/api/users/me': serviceUser }
  const missing = await checkDevRequirements({
    project: makeProject('0.1.0'),
    connection,
    fetch: fakeServer({ ...answers, '/api/addons': { addons: [] } }),
  })
  expect(summary(missing)).toEqual(['server:ok', 'user:ok', 'addon:error'])
  expect(missing[2].message).toContain('/api/addons/timetracker/0.1.0/... answer 404')
  expect(missing[2].fix).toContain('create_package.py')

  const otherVersion = await checkDevRequirements({
    project: makeProject('0.2.0'),
    connection,
    fetch: fakeServer({ ...answers, '/api/addons': installed({ '0.1.0': {} }) }),
  })
  expect(otherVersion[2].message).toContain('timetracker 0.2.0 is not installed (the server has 0.1.0)')

  // no server code: nothing calls its endpoints, so only a warning
  const frontendOnly = await checkDevRequirements({
    project: makeProject('0.2.0', { server: false }),
    connection,
    fetch: fakeServer({ ...answers, '/api/addons': installed({ '0.1.0': {} }) }),
  })
  expect(summary(frontendOnly)).toEqual(['server:ok', 'user:ok', 'addon:warning'])

  const broken = await checkDevRequirements({
    project: makeProject('0.1.0'),
    connection,
    fetch: fakeServer({ ...answers, '/api/addons': installed({ '0.1.0': { isBroken: true } }) }),
  })
  expect(summary(broken)).toEqual(['server:ok', 'user:ok', 'addon:error'])
})

test('the version in src/addonVersion.ts is the one checked, and a mismatch with package.py warns', async () => {
  const checks = await checkDevRequirements({
    project: makeProject('0.2.0', { frontendVersion: '0.1.0' }),
    connection,
    fetch: fakeServer({
      '/api/info': {},
      '/api/users/me': serviceUser,
      '/api/addons': installed({ '0.1.0': {} }),
    }),
  })
  expect(summary(checks)).toEqual(['server:ok', 'user:ok', 'addonVersion:warning', 'addon:ok'])
})

test('the versionModule from ayonAddon({ rest }) is checked instead of src/addonVersion.ts', async () => {
  // src/addonVersion.ts matches package.py, the configured module is one version behind
  const project = makeProject('0.2.0')
  mkdirSync(path.join(project.root, 'src', 'api'), { recursive: true })
  writeFileSync(path.join(project.root, 'src', 'api', 'version.ts'), 'export default "0.1.0";\n')
  const fetch = fakeServer({
    '/api/info': {},
    '/api/users/me': serviceUser,
    '/api/addons': installed({ '0.1.0': {} }),
  })

  const configured = await checkDevRequirements({
    project,
    connection,
    versionModule: 'src/api/version.ts',
    fetch,
  })
  expect(summary(configured)).toEqual(['server:ok', 'user:ok', 'addonVersion:warning', 'addon:ok'])
  expect(configured[2].message).toContain('src/api/version.ts says 0.1.0')

  // without one, the default module is read: it matches, and its version 0.2.0 is not installed
  const defaults = await checkDevRequirements({ project, connection, fetch })
  expect(summary(defaults)).toEqual(['server:ok', 'user:ok', 'addon:error'])
})
