import { expect, test } from '@playwright/test'
import { spawnSync } from 'child_process'
import { existsSync } from 'fs'
import path from 'path'
import { checkManifest, checkSlotDeclarations } from '../../addon/src/validate'
import {
  getContributions,
  getRegistry,
  registerManifest,
  registerManifests,
  unregisterAddon,
} from '../../addon/src/registry'
import { provideHost } from '../../addon/src/hostBridge'
import { runContribution } from '../../addon/src/pieces'
import { loadManifests } from '../../shared/src/context/remote-modules/loadManifests'

const planner = { name: 'planner', version: '2.0.0', remote: 'planner' }
const tracker = { name: 'timetracker', version: '1.0.0', remote: 'timetracker' }
const SLOT = 'planner.eventMenuItem'

const run = () => Promise.resolve({ default: () => undefined })
const declaration = { name: SLOT, version: 2, required: ['label', 'icon'], pieces: ['run'] }
const plannerManifest = { slots: [declaration], contributes: [] }
const item = (fields: object = {}) => ({
  slot: SLOT,
  id: 'start_timer',
  label: 'Start timer',
  icon: 'play_arrow',
  run,
  ...fields,
})
const trackerManifest = (...contributes: object[]) => ({ contributes })

// the console warnings of `fn`
const warnings = async (fn: () => unknown) => {
  const original = console.warn
  const lines: string[] = []
  console.warn = (line: string) => lines.push(line)
  try {
    await fn()
  } finally {
    console.warn = original
  }
  return lines
}

test.afterEach(() => {
  unregisterAddon(planner.name)
  unregisterAddon(tracker.name)
  unregisterAddon('other')
})

test('a declared slot is in the registry with its owner', () => {
  registerManifest(planner, plannerManifest)
  expect(getRegistry().slots).toEqual([{ ...declaration, owner: planner }])
})

test('a declaration under another addon\'s name is skipped, naming both addons', async () => {
  const lines = await warnings(() =>
    registerManifests([
      { addon: planner, manifest: plannerManifest },
      { addon: tracker, manifest: { slots: [declaration], contributes: [] } },
    ]),
  )
  expect(getRegistry().slots.map((s) => s.owner.name)).toEqual(['planner'])
  expect(lines).toEqual([
    '[addon timetracker] skipped slot declaration "planner.eventMenuItem": only addon "planner" can declare it: slots of addon "timetracker" start with "timetracker."',
  ])
})

test('a second declaration of a name is skipped, naming the addon that has it', () => {
  const shared = { ...declaration, name: 'a.b.menu' }
  const first = { name: 'a', version: '1', remote: 'a' }
  const second = { name: 'a.b', version: '1', remote: 'ab' }
  const { slots } = checkSlotDeclarations(first, { slots: [shared] })
  const result = checkSlotDeclarations(second, { slots: [shared] }, slots)
  expect(result.slots).toEqual([])
  expect(result.skipped[0].reason).toBe('addon "a" already declares it')
  expect(checkSlotDeclarations(first, { slots: [shared, shared] }).skipped[0].reason).toBe(
    'addon "a" already declares it',
  )
})

test("an addon can't take one of AYON's slots, and a broken declaration is skipped", () => {
  const addon = { name: 'project', version: '1', remote: 'project' }
  const check = (slots: unknown[]) => checkSlotDeclarations(addon, { slots }).skipped[0]?.reason
  expect(check([{ ...declaration, name: 'project.page' }])).toBe("it is one of AYON's own slots")
  expect(check([{ ...declaration, name: 'project' }])).toContain('invalid name')
  expect(check([{ ...declaration, name: 'project.x', version: 0 }])).toContain('version')
  expect(check([{ ...declaration, name: 'project.x', pieces: 'run' }])).toContain('pieces')
})

// the order of the host's load, not of the registry calls: the contributor's manifest resolves first
test('the result does not depend on the order the manifests resolve in', async () => {
  const remotes = [planner, tracker].map((a) => ({
    remote: a.remote,
    addon: a.name,
    version: a.version,
    modules: ['manifest'],
  }))
  const manifests: Record<string, object> = {
    'planner/manifest': plannerManifest,
    'timetracker/manifest': trackerManifest(item()),
  }
  const resolved: string[] = []
  const load = (delays: Record<string, number>) => async (id: string) => {
    await new Promise((resolve) => setTimeout(resolve, delays[id]))
    resolved.push(id)
    return { default: manifests[id] }
  }

  for (const delays of [
    { 'planner/manifest': 20, 'timetracker/manifest': 0 },
    { 'planner/manifest': 0, 'timetracker/manifest': 20 },
  ]) {
    resolved.length = 0
    unregisterAddon(planner.name)
    unregisterAddon(tracker.name)
    const lines = await warnings(() => loadManifests(remotes, load(delays)))
    expect(lines).toEqual([])
    expect(getContributions(SLOT as never).contributions.map((c: { key: string }) => c.key)).toEqual([
      'timetracker.start_timer',
    ])
    expect(getRegistry().addons.map((a) => a.name)).toEqual(['planner', 'timetracker'])
  }
  // the last round did resolve the declaring addon first, the one before the contributor first
  expect(resolved[0]).toBe('planner/manifest')
})

test('a contribution to an undeclared slot is skipped, naming it; the others register', async () => {
  const lines = await warnings(() =>
    registerManifests([
      {
        addon: tracker,
        manifest: trackerManifest(item(), {
          slot: 'detailsPanel.menuItem',
          id: 'other',
          label: 'Other',
          icon: 'x',
          run,
        }),
      },
    ]),
  )
  expect(getRegistry().contributions.map((c) => c.key)).toEqual(['timetracker.other'])
  expect(lines).toEqual([
    '[addon timetracker] skipped contribution "start_timer" for slot "planner.eventMenuItem": this AYON version has no such slot, and no addon in the bundle declares it (it would be addon "planner")',
  ])
})

test('registering the declaring addon later brings in the contributions it was missing', async () => {
  await warnings(() => registerManifest(tracker, trackerManifest(item())))
  expect(getRegistry().contributions).toEqual([])
  registerManifest(planner, plannerManifest)
  expect(getRegistry().contributions.map((c) => c.key)).toEqual(['timetracker.start_timer'])
  // and removing it takes them out again
  await warnings(() => unregisterAddon(planner.name))
  expect(getRegistry().contributions).toEqual([])
  expect(getRegistry().slots).toEqual([])
})

test('slotVersion: newer than the declared version is skipped, older and equal register', () => {
  const available = { [SLOT]: { ...declaration, owner: planner } }
  const check = (slotVersion: unknown) =>
    checkManifest(tracker, trackerManifest(item({ slotVersion })), available)
  expect(check(1).contributions).toHaveLength(1)
  expect(check(2).contributions).toHaveLength(1)
  expect(check(undefined).contributions).toHaveLength(1)
  expect(check(3).contributions).toEqual([])
  expect(check(3).skipped[0].reason).toBe(
    'it was built for version 3 of the slot, but addon "planner" has version 2: update addon "planner"',
  )
  expect(check('2').skipped[0].reason).toBe('invalid slotVersion "2"')
})

test('fields and pieces of a declared slot are checked like a built-in slot', () => {
  const available = { [SLOT]: { ...declaration, owner: planner } }
  const { skipped } = checkManifest(
    tracker,
    trackerManifest({ slot: SLOT, id: 'a', icon: 'x', run }, { slot: SLOT, id: 'b', label: 'B', icon: 'x', run: 'nope' }),
    available,
  )
  expect(skipped.map((s) => s.reason)).toEqual([
    'missing label',
    "run must be a loader: () => import('./File')",
  ])
})

test('a failing or missing piece is reported, not thrown', async () => {
  const errors: unknown[][] = []
  const original = console.error
  console.error = (...args: unknown[]) => errors.push(args)
  provideHost({ getUser: () => ({ name: 'admin' }) } as never)
  try {
    registerManifests([
      { addon: planner, manifest: plannerManifest },
      {
        addon: tracker,
        manifest: trackerManifest(item({ run: () => Promise.reject(new Error('chunk gone')) })),
      },
    ])
    const [contribution] = getContributions(SLOT as never).contributions
    await expect(
      runContribution(contribution as never, { projectName: 'p', entities: [] } as never),
    ).resolves.toBeUndefined()
    expect(String(errors[0]?.[0])).toContain('timetracker.start_timer')
  } finally {
    console.error = original
  }
})

// tsc on a contributor with two contract packages: the fixture's @ts-expect-error lines are the
// assertions. It needs addon/dist/types (yarn build:addon).
test('contract packages type contributions in both entries', () => {
  const root = path.resolve(__dirname, '../..')
  test.skip(!existsSync(path.join(root, 'addon/dist/types/index.d.ts')), 'addon/dist is not built')
  const result = spawnSync(
    process.execPath,
    [
      path.join(root, 'node_modules/typescript/bin/tsc'),
      '--noEmit',
      '-p',
      path.join(root, 'tests/unit/fixtures/addon-contract/tsconfig.json'),
    ],
    { encoding: 'utf8' },
  )
  expect(`${result.stdout}${result.stderr}`).toBe('')
  expect(result.status).toBe(0)
})
