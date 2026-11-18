import { expect, test } from '@playwright/test'
import { mkdirSync, mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import {
  addonDevInfoProblem,
  addonDevUserProblem,
  fetchAddonDevInfo,
  parseAddonDevParam,
  parseAddonDevParams,
  readAddonDevRequests,
  readStoredAddonDevOverrides,
  removeAddonDevEntry,
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

// localStorage as the page has it
const memoryStorage = (initial: Record<string, string> = {}) => {
  const items = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
    removeItem: (key: string) => void items.delete(key),
    raw: () => items.get('ayon-addon-dev'),
  } as unknown as Storage & { raw: () => string | undefined }
}
const planner = { addon: 'planner', url: 'http://localhost:5173' }
const timetracker = { addon: 'timetracker', url: 'http://localhost:5174' }

test('several overrides: comma separated, repeated, the last per addon wins', () => {
  expect(
    parseAddonDevParams(['planner@http://localhost:5173,timetracker@http://localhost:5174']),
  ).toEqual([{ override: planner }, { override: timetracker }])
  expect(
    parseAddonDevParams(['planner@http://localhost:5173', ' timetracker@http://localhost:5174/ ']),
  ).toEqual([{ override: planner }, { override: timetracker }])
  expect(
    parseAddonDevParams(['planner@http://localhost:9999,planner@http://localhost:5173']),
  ).toEqual([{ override: planner }])
  // a bad entry is rejected on its own, the others still load
  const [bad, good] = parseAddonDevParams([
    'a@http://192.168.1.4:5173,planner@http://localhost:5173',
  ])
  expect(bad).toHaveProperty('reason')
  expect(good).toEqual({ override: planner })
})

test('the overrides from the URL replace the stored ones, and off clears them', () => {
  const storage = memoryStorage({
    'ayon-addon-dev': JSON.stringify([{ addon: 'old', url: 'http://localhost:1' }]),
  })
  const both = '?addonDev=planner@http://localhost:5173&addonDev=timetracker@http://localhost:5174'
  expect(readAddonDevRequests(both, storage)).toEqual([
    { override: planner },
    { override: timetracker },
  ])
  expect(readStoredAddonDevOverrides(storage)).toEqual([planner, timetracker])
  // a later page without the parameter keeps them
  expect(readAddonDevRequests('', storage)).toEqual([
    { override: planner },
    { override: timetracker },
  ])
  expect(readAddonDevRequests('?addonDev=off', storage)).toEqual([])
  expect(storage.raw()).toBeUndefined()
  expect(readAddonDevRequests('?addonDev=', memoryStorage())).toEqual([])
})

test('a single override stored before several were supported still loads; non-local ones do not', () => {
  expect(
    readStoredAddonDevOverrides(memoryStorage({ 'ayon-addon-dev': JSON.stringify(planner) })),
  ).toEqual([planner])
  const stored = JSON.stringify([planner, { addon: 'x', url: 'http://evil.example.com' }])
  expect(readStoredAddonDevOverrides(memoryStorage({ 'ayon-addon-dev': stored }))).toEqual([
    planner,
  ])
  expect(readStoredAddonDevOverrides(memoryStorage({ 'ayon-addon-dev': '{' }))).toEqual([])
})

test("closing one addon's row keeps the others", () => {
  const storage = memoryStorage({ 'ayon-addon-dev': JSON.stringify([planner, timetracker]) })
  const params = ['planner@http://localhost:5173/,timetracker@http://localhost:5174']
  expect(removeAddonDevEntry('planner@http://localhost:5173', params, storage)).toBe(
    'timetracker@http://localhost:5174',
  )
  expect(readStoredAddonDevOverrides(storage)).toEqual([timetracker])
  expect(
    removeAddonDevEntry(
      'timetracker@http://localhost:5174',
      ['timetracker@http://localhost:5174'],
      storage,
    ),
  ).toBeNull()
  expect(storage.raw()).toBeUndefined()
  // a rejected entry goes by what was written
  expect(removeAddonDevEntry('nope', ['nope,planner@http://localhost:5173'], memoryStorage())).toBe(
    'planner@http://localhost:5173',
  )
})

test('only developer-mode and service users may use the override', () => {
  expect(addonDevUserProblem({ attrib: { developerMode: true } })).toBeNull()
  expect(addonDevUserProblem({ data: { isService: true } })).toBeNull()
  expect(addonDevUserProblem({ data: { isDeveloper: true } })).toContain('turn on Developer Mode')
  expect(addonDevUserProblem({ attrib: {}, data: {} })).toContain('not a developer')
})

const override = { addon: 'timetracker', url: 'http://localhost:5173' }
const info = {
  name: 'timetracker',
  version: '0.1.0',
  remote: 'timetracker',
  modules: ['manifest'],
  buildId: 'x',
}

test('/ayon-addon.json must be complete and name the requested addon', () => {
  expect(addonDevInfoProblem(info, override)).toBeNull()
  expect(addonDevInfoProblem({ ...info, buildId: undefined }, override)).toContain(
    'invalid (no buildId)',
  )
  expect(addonDevInfoProblem({ name: 'timetracker' }, override)).toContain(
    'no version, remote, buildId, modules',
  )
  expect(addonDevInfoProblem('html', override)).toContain('invalid')
  expect(addonDevInfoProblem({ ...info, name: 'other' }, override)).toContain(
    'serves "other", not "timetracker": open ?addonDev=other@http://localhost:5173',
  )
})

test('a dev server that is down, not the CLI, or serves something else says why', async () => {
  const realFetch = globalThis.fetch
  const answer = (response: () => Promise<Response>) =>
    (globalThis.fetch = response as typeof fetch)
  try {
    answer(() => Promise.reject(new TypeError('Failed to fetch')))
    await expect(fetchAddonDevInfo(override)).rejects.toThrow(
      'no answer from http://localhost:5173',
    )
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

const connection = {
  serverUrl: 'http://localhost:5100',
  apiKey: 'key',
  apiKeySource: 'data/local-api-key',
}
const serviceUser = { name: 'workbench', attrib: {}, data: { isService: true } }
const installed = (versions: Record<string, object>) => ({
  addons: [{ name: 'timetracker', versions }],
})
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
  const checks = await checkDevRequirements({
    project: makeProject('0.1.0'),
    connection,
    fetch: fakeServer({}),
  })
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
  expect(otherVersion[2].message).toContain(
    'timetracker 0.2.0 is not installed (the server has 0.1.0)',
  )

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
