import { expect, test } from '@playwright/test'
import { spawnSync } from 'child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import os, { tmpdir } from 'os'
import path from 'path'
import { checkManifest, checkSlotDeclarations } from '../../addon/src/validate'
import { SLOTS } from '../../addon/src/slots'
import {
  getContributions,
  getRegistry,
  registerManifest,
  registerManifests,
  setManifestsLoading,
  unregisterAddon,
} from '../../addon/src/registry'
import { provideHost } from '../../addon/src/hostBridge'
import { runContribution } from '../../addon/src/pieces'
import { readContractSlots } from '../../addon-dev/src/contractSlots'
import { loadManifests } from '../../shared/src/context/remote-modules/loadManifests'
import { useSlotMenuItems } from '../../addon/src/SlotOutlet'
import { manifestSnippet } from '../../addon-dev/shell/src/places'
import { renderToHtml } from './support/render'

const example = { name: 'example', version: '2.0.0', remote: 'example' }
const contributor = { name: 'contributor', version: '1.0.0', remote: 'contributor' }
const SLOT = 'example.itemMenuItem'

const run = () => Promise.resolve({ default: () => undefined })
const declaration = { name: SLOT, version: 1, required: ['label', 'icon'], pieces: ['run'] }
const exampleManifest = { slots: [declaration], contributes: [] }
const item = (fields: object = {}) => ({
  slot: SLOT,
  id: 'open_details',
  label: 'Open details',
  icon: 'play_arrow',
  run,
  ...fields,
})
const contributorManifest = (...contributes: object[]) => ({ contributes })

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

test.beforeEach(() => setManifestsLoading(false))

test.afterEach(() => {
  provideHost({ getUser: undefined })
  unregisterAddon(example.name)
  unregisterAddon(contributor.name)
  unregisterAddon('other')
})

test('a declared slot is in the registry with its owner', () => {
  registerManifest(example, exampleManifest)
  expect(getRegistry().slots).toEqual([{ ...declaration, owner: example }])
})

test('a declaration under another addon\'s name is skipped, naming both addons', async () => {
  const lines = await warnings(() =>
    registerManifests([
      { addon: example, manifest: exampleManifest },
      { addon: contributor, manifest: { slots: [declaration], contributes: [] } },
    ]),
  )
  expect(getRegistry().slots.map((s) => s.owner.name)).toEqual(['example'])
  expect(lines).toEqual([
    '[addon contributor] skipped slot declaration "example.itemMenuItem": only addon "example" can declare it: slots of addon "contributor" are named "contributor.<name>"',
  ])
})

test('a name is the addon\'s name, a dot and one more part; the warning names the real owner', () => {
  // addon names can have dots: "a.b.menu" is addon "a.b"'s, not addon "a"'s
  const first = { name: 'a', version: '1', remote: 'a' }
  const second = { name: 'a.b', version: '1', remote: 'ab' }
  const reason = (addon: typeof first, name: unknown) =>
    checkSlotDeclarations(addon, { slots: [{ ...declaration, name }] }).skipped[0]?.reason
  expect(reason(first, 'a.b.menu')).toBe('only addon "a.b" can declare it: slots of addon "a" are named "a.<name>"')
  expect(reason(second, 'a.b.menu')).toBeUndefined()
  expect(reason(second, 'a.menu')).toBe('only addon "a" can declare it: slots of addon "a.b" are named "a.b.<name>"')
  expect(reason(first, 'a.1menu')).toContain('invalid name "a.1menu"')
  expect(reason(first, 'a.')).toContain('invalid name "a."')
  expect(reason(first, 'a')).toContain('invalid name "a"')
  expect(reason(first, 3)).toContain('invalid name 3')
  // under one of AYON's prefixes there is no addon to name
  expect(reason(first, 'project.menu')).toBe(
    'names under "project." are AYON\'s: slots of addon "a" are named "a.<name>"',
  )
})

test('a second declaration of a name is skipped, naming the addon that has it', () => {
  const shared = { ...declaration, name: 'a.menu' }
  const first = { name: 'a', version: '1', remote: 'a' }
  const { slots } = checkSlotDeclarations(first, { slots: [shared] })
  const result = checkSlotDeclarations({ ...first, remote: 'a2' }, { slots: [shared] }, slots)
  expect(result.slots).toEqual([])
  expect(result.skipped[0].reason).toBe('addon "a" already declares it')
  expect(checkSlotDeclarations(first, { slots: [shared, shared] }).skipped[0].reason).toBe(
    'addon "a" already declares it',
  )
})

test("an addon can't take one of AYON's slots, and a broken declaration is skipped", () => {
  const addon = { name: 'example', version: '1', remote: 'example' }
  const check = (slots: unknown[]) => checkSlotDeclarations(addon, { slots }).skipped[0]?.reason
  expect(check([{ ...declaration, name: 'project.page' }])).toBe("it is one of AYON's own slots")
  expect(check([{ ...declaration, name: 'example' }])).toContain('invalid name')
  expect(check([{ ...declaration, name: 'example.x', version: 0 }])).toContain('version')
  expect(check([{ ...declaration, name: 'example.x', pieces: 'run' }])).toContain('pieces')
})

test("an addon named like the first part of AYON's slots can't declare slots", () => {
  for (const name of ['project', 'studio', 'header', 'detailsPanel', 'app']) {
    const addon = { name, version: '1', remote: name }
    const { slots, skipped } = checkSlotDeclarations(addon, { slots: [{ ...declaration, name: `${name}.x` }] })
    expect(slots).toEqual([])
    expect(skipped[0].reason).toBe(
      `slots named "${name}.<name>" are AYON's: an addon named "${name}" can't declare slots`,
    )
  }
  // only the first part: an addon "project.tools" is not AYON's
  const tools = { name: 'project.tools', version: '1', remote: 'tools' }
  expect(checkSlotDeclarations(tools, { slots: [{ ...declaration, name: 'project.tools.x' }] }).slots).toHaveLength(1)
})

// the order of the host's load, not of the registry calls: the contributor's manifest resolves first
test('the result does not depend on the order the manifests resolve in', async () => {
  const remotes = [example, contributor].map((a) => ({
    remote: a.remote,
    addon: a.name,
    version: a.version,
    modules: ['manifest'],
  }))
  const manifests: Record<string, object> = {
    'example/manifest': exampleManifest,
    'contributor/manifest': contributorManifest(item()),
  }
  const resolved: string[] = []
  const load = (delays: Record<string, number>) => async (id: string) => {
    await new Promise((resolve) => setTimeout(resolve, delays[id]))
    resolved.push(id)
    return { default: manifests[id] }
  }

  for (const delays of [
    { 'example/manifest': 20, 'contributor/manifest': 0 },
    { 'example/manifest': 0, 'contributor/manifest': 20 },
  ]) {
    resolved.length = 0
    unregisterAddon(example.name)
    unregisterAddon(contributor.name)
    setManifestsLoading(true)
    const lines = await warnings(() => loadManifests(remotes, load(delays)))
    expect(lines).toEqual([])
    expect(getContributions(SLOT as never).contributions.map((c: { key: string }) => c.key)).toEqual([
      'contributor.open_details',
    ])
    expect(getRegistry().addons.map((a) => a.name)).toEqual(['example', 'contributor'])
  }
  // the last round did resolve the declaring addon first, the one before the contributor first
  expect(resolved[0]).toBe('example/manifest')
})

test('a slow manifest only delays its own addon', async () => {
  const remotes = [example, contributor].map((a) => ({
    remote: a.remote,
    addon: a.name,
    version: a.version,
    modules: ['manifest'],
  }))
  const menuItem = { slot: 'detailsPanel.menuItem', id: 'other', label: 'Other', icon: 'x', run }
  let finishExample = (_: { default: unknown }) => {}
  const load = (id: string): Promise<{ default: unknown }> =>
    id === 'example/manifest'
      ? new Promise((resolve) => (finishExample = resolve))
      : Promise.resolve({ default: contributorManifest(item(), menuItem) })

  setManifestsLoading(true)
  const lines = await warnings(async () => {
    const done = loadManifests(remotes, load)
    await new Promise((resolve) => setTimeout(resolve))
    // the contributor is in, its item for the example's slot waits for the example
    expect(getRegistry().contributions.map((c) => c.key)).toEqual(['contributor.other'])
    expect(getRegistry().isLoading).toBe(true)

    finishExample({ default: exampleManifest })
    await done
  })
  expect(lines).toEqual([])
  expect(getRegistry().isLoading).toBe(false)
  expect(getRegistry().contributions.map((c) => c.key).sort()).toEqual([
    'contributor.open_details',
    'contributor.other',
  ])
  // the order of the bundle, though the contributor arrived first
  expect(getRegistry().addons.map((a) => a.name)).toEqual(['example', 'contributor'])
})

test('a slot nobody declares warns once, when every manifest is in', async () => {
  setManifestsLoading(true)
  const whileLoading = await warnings(() =>
    registerManifests([
      {
        addon: contributor,
        manifest: contributorManifest(item(), { slot: 'nope', id: 'a' }, { slot: 'project.newSlot', id: 'b' }),
      },
    ]),
  )
  // an unknown slot of AYON's own (a newer AYON's) can't be declared later: that one doesn't wait,
  // and it names no addon
  expect(whileLoading).toEqual([
    '[addon contributor] skipped contribution "a" for slot "nope": this AYON version has no such slot',
    '[addon contributor] skipped contribution "b" for slot "project.newSlot": this AYON version has no such slot',
  ])
  const atTheEnd = await warnings(() => setManifestsLoading(false))
  expect(atTheEnd).toEqual([
    '[addon contributor] skipped contribution "open_details" for slot "example.itemMenuItem": this AYON version has no such slot, and no addon in the bundle declares it (it would be addon "example")',
  ])
})

test('a contribution to an undeclared slot is skipped, naming it; the others register', async () => {
  const lines = await warnings(() =>
    registerManifests([
      {
        addon: contributor,
        manifest: contributorManifest(item(), {
          slot: 'detailsPanel.menuItem',
          id: 'other',
          label: 'Other',
          icon: 'x',
          run,
        }),
      },
    ]),
  )
  expect(getRegistry().contributions.map((c) => c.key)).toEqual(['contributor.other'])
  expect(lines).toEqual([
    '[addon contributor] skipped contribution "open_details" for slot "example.itemMenuItem": this AYON version has no such slot, and no addon in the bundle declares it (it would be addon "example")',
  ])
})

test('registering the declaring addon later brings in the contributions it was missing', async () => {
  await warnings(() => registerManifest(contributor, contributorManifest(item())))
  expect(getRegistry().contributions).toEqual([])
  registerManifest(example, exampleManifest)
  expect(getRegistry().contributions.map((c) => c.key)).toEqual(['contributor.open_details'])
  // and removing it takes them out again
  await warnings(() => unregisterAddon(example.name))
  expect(getRegistry().contributions).toEqual([])
  expect(getRegistry().slots).toEqual([])
})

test("a registered contribution keeps its object when another addon's manifest arrives", () => {
  const menuItem = { slot: 'detailsPanel.menuItem', id: 'other', label: 'Other', icon: 'x', run }
  const slotItem = item()
  registerManifests([
    { addon: example, manifest: exampleManifest },
    { addon: contributor, manifest: contributorManifest(slotItem, menuItem) },
  ])
  const before = getRegistry().contributions
  registerManifests([{ addon: { ...contributor, name: 'other' }, manifest: contributorManifest({ ...menuItem }) }])
  const after = getRegistry().contributions.filter((c) => c.addon.name === 'contributor')
  expect(after).toHaveLength(2)
  after.forEach((contribution, index) => expect(contribution).toBe(before[index]))
  // a changed manifest of the addon itself gives new objects
  registerManifests([{ addon: contributor, manifest: contributorManifest(slotItem, { ...menuItem }) }])
  const changed = getRegistry().contributions.filter((c) => c.addon.name === 'contributor')
  expect(changed[0]).toBe(before[0])
  expect(changed[1]).not.toBe(before[1])
})

test('an addon with two remotes that expose a manifest registers once, the later one', async () => {
  const remotes = ['first', 'second'].map((remote) => ({
    remote,
    addon: contributor.name,
    version: contributor.version,
    modules: ['manifest'],
  }))
  const manifests: Record<string, object> = {
    'first/manifest': { slots: [{ ...declaration, name: 'contributor.menu' }], contributes: [item({ id: 'one' })] },
    'second/manifest': { slots: [{ ...declaration, name: 'contributor.menu' }], contributes: [item({ id: 'two' })] },
  }
  registerManifest(example, exampleManifest)
  setManifestsLoading(true)
  const lines = await warnings(() => loadManifests(remotes, async (id) => ({ default: manifests[id] })))
  expect(lines).toEqual([])
  expect(getRegistry().contributions.map((c) => c.key)).toEqual(['contributor.two'])
  expect(getRegistry().slots.map((slot) => `${slot.owner.remote}:${slot.name}`)).toEqual([
    'example:example.itemMenuItem',
    'second:contributor.menu',
  ])
})

test('slotVersion: only the declared version registers', () => {
  const available = { [SLOT]: { ...declaration, version: 2, owner: example } }
  const check = (slotVersion: unknown) =>
    checkManifest(contributor, contributorManifest(item({ slotVersion })), available)
  expect(check(2).contributions).toHaveLength(1)
  expect(check(3).contributions).toEqual([])
  expect(check(3).skipped[0].reason).toBe(
    'it was built for version 3 of the slot, but addon "example" has version 2: update addon "example"',
  )
  expect(check(1).contributions).toEqual([])
  expect(check(1).skipped[0].reason).toBe(
    'it was built for version 1 of the slot, but addon "example" has version 2, which is not compatible: update addon "contributor"',
  )
  expect(check('2').skipped[0].reason).toBe('invalid slotVersion "2"')
})

test("slotVersion: one left out counts as 1 for an addon's slot, and isn't checked for AYON's", () => {
  const check = (version: number) =>
    checkManifest(contributor, contributorManifest(item()), { [SLOT]: { ...declaration, version, owner: example } })
  expect(check(1).contributions).toHaveLength(1)
  expect(check(2).contributions).toEqual([])
  expect(check(2).skipped[0].reason).toBe(
    'it has no slotVersion, so it counts as built for version 1 of the slot, but addon "example" has version 2, which is not compatible: update addon "contributor"',
  )
  // AYON's own slots: as before, only a newer stamped version is skipped
  const menuItem = { slot: 'detailsPanel.menuItem', id: 'a', label: 'A', icon: 'x', run }
  const builtIn = { 'detailsPanel.menuItem': { ...SLOTS['detailsPanel.menuItem'], version: 2 } }
  expect(checkManifest(contributor, contributorManifest(menuItem), builtIn).contributions).toHaveLength(1)
  expect(
    checkManifest(contributor, contributorManifest({ ...menuItem, slotVersion: 1 }), builtIn).contributions,
  ).toHaveLength(1)
  expect(
    checkManifest(contributor, contributorManifest({ ...menuItem, slotVersion: 3 }), builtIn).skipped[0].reason,
  ).toBe('it was built for version 3 of the slot, but this AYON version has version 2: update AYON')
})

test('a check that throws skips that contribution, and later manifests still register', async () => {
  const strict = {
    ...declaration,
    check: ({ itemTypes }: { itemTypes: string[] }) => (itemTypes.length ? undefined : 'empty'),
  }
  const lines = await warnings(() =>
    registerManifests([
      { addon: example, manifest: { slots: [strict], contributes: [] } },
      { addon: contributor, manifest: contributorManifest(item(), item({ id: 'scoped', itemTypes: ['a'] })) },
    ]),
  )
  expect(getContributions(SLOT as never).contributions.map((c) => (c as { id: string }).id)).toEqual(['scoped'])
  expect(lines).toHaveLength(1)
  expect(lines[0]).toContain('[addon contributor] skipped contribution "open_details"')
  expect(lines[0]).toContain('the check of the slot failed (addon "example")')

  await warnings(() => registerManifest({ ...contributor, name: 'other' }, contributorManifest(item({ id: 'later', itemTypes: ['a'] }))))
  expect(getContributions(SLOT as never).contributions.map((c) => (c as { id: string }).id)).toEqual(['scoped', 'later'])
})

test('a pattern that keeps state is refused, so registering twice gives the same result', () => {
  for (const flags of ['g', 'y']) {
    const { slots, skipped } = checkSlotDeclarations(example, {
      slots: [{ ...declaration, optional: { position: new RegExp('^bottom$', flags) } }],
    })
    expect(slots).toEqual([])
    expect(skipped[0].reason).toBe('optional must map field names to patterns without the g or y flag')
  }
})

test('a loader that throws or rejects does not stop the menu being built', async () => {
  registerManifests([
    { addon: example, manifest: exampleManifest },
    {
      addon: contributor,
      manifest: contributorManifest(
        item({
          id: 'throws',
          label: 'Throws',
          run: () => {
            throw new Error('failed')
          },
        }),
        item({ id: 'rejects', label: 'Rejects', run: () => Promise.reject(new Error('failed')) }),
      ),
    },
  ])
  let labels: string[] = []
  const Menu = () => {
    const build = useSlotMenuItems(SLOT as never) as unknown as (context: object) => {
      bottom: { label: string }[]
    }
    labels = build({}).bottom.map((entry) => entry.label)
    return null
  }
  renderToHtml(Menu)
  expect(labels).toEqual(['Throws', 'Rejects'])
  await new Promise((resolve) => setTimeout(resolve))
})

test('fields and pieces of a declared slot are checked like a built-in slot', () => {
  const available = { [SLOT]: { ...declaration, owner: example } }
  const { skipped } = checkManifest(
    contributor,
    contributorManifest({ slot: SLOT, id: 'a', icon: 'x', run }, { slot: SLOT, id: 'b', label: 'B', icon: 'x', run: 'nope' }),
    available,
  )
  expect(skipped.map((s) => s.reason)).toEqual([
    'missing label',
    "run must be a loader: () => import('./File')",
  ])
})

test('useSlotMenuItems leaves out what the surface says does not apply', () => {
  registerManifests([
    { addon: example, manifest: exampleManifest },
    {
      addon: contributor,
      manifest: contributorManifest(
        item({ itemTypes: ['task'] }),
        item({ id: 'everywhere', label: 'Everywhere' }),
      ),
    },
  ])
  const labelsFor = (eventType: string) => {
    let labels: string[] = []
    const Menu = () => {
      const build = useSlotMenuItems(SLOT as never) as unknown as (
        context: object,
        applies: (item: { itemTypes?: string[] }) => boolean,
      ) => { bottom: { label: string }[] }
      labels = build({}, ({ itemTypes }) => !itemTypes || itemTypes.includes(eventType)).bottom.map(
        (entry) => entry.label,
      )
      return null
    }
    renderToHtml(Menu)
    return labels
  }
  expect(labelsFor('task')).toEqual(['Open details', 'Everywhere'])
  expect(labelsFor('version')).toEqual(['Everywhere'])
})

test('a failing or missing piece is reported, not thrown', async () => {
  const errors: unknown[][] = []
  const original = console.error
  console.error = (...args: unknown[]) => errors.push(args)
  provideHost({ getUser: () => ({ name: 'admin' }) } as never)
  try {
    registerManifests([
      { addon: example, manifest: exampleManifest },
      {
        addon: contributor,
        manifest: contributorManifest(item({ run: () => Promise.reject(new Error('chunk gone')) })),
      },
    ])
    const [contribution] = getContributions(SLOT as never).contributions
    await expect(
      runContribution(contribution as never, { projectName: 'p', entities: [] } as never),
    ).resolves.toBeUndefined()
    expect(String(errors[0]?.[0])).toContain('contributor.open_details')
  } finally {
    console.error = original
  }
})

// tsc on a contributor with two contract packages: the fixture's @ts-expect-error lines are the
// assertions. It checks the published types, so it builds the package first (a few seconds): its
// declarations go to addon/dist/types as in `yarn build:addon`, the JS to a temporary folder.
test('contract packages type contributions in both entries', () => {
  test.setTimeout(120_000)
  const root = path.resolve(__dirname, '../..')
  const run = (args: string[], cwd = root) => {
    const result = spawnSync(process.execPath, args, { cwd, encoding: 'utf8' })
    return { output: `${result.stdout}${result.stderr}`, status: result.status }
  }
  const outDir = mkdtempSync(path.join(os.tmpdir(), 'ayon-addon-build-'))
  try {
    const build = run(
      [path.join(root, 'node_modules/vite/bin/vite.js'), 'build', '--outDir', outDir, '--logLevel', 'error'],
      path.join(root, 'addon'),
    )
    expect(build.status, `building @ynput/ayon-addon failed:\n${build.output}`).toBe(0)
  } finally {
    rmSync(outDir, { recursive: true, force: true })
  }
  const tsc = (project: string) => run([path.join(root, 'node_modules/typescript/bin/tsc'), '--noEmit', '-p', project])
  const fixture = path.join(root, 'tests/unit/fixtures/addon-contract')
  const result = tsc(path.join(fixture, 'tsconfig.json'))
  expect(result.output).toBe('')
  expect(result.status).toBe(0)

  // the dev shell's manifest entries for an addon's slot compile as they are, at version 1 and
  // after a breaking change (2), with the piece file they import
  const generated = mkdtempSync(path.join(os.tmpdir(), 'ayon-addon-snippets-'))
  try {
    const files = [1, 2].map((version) => {
      const snippet = manifestSnippet({
        name: 'example.itemMenuItem',
        version,
        required: ['label', 'icon'],
        pieces: ['run'],
      })
      const file = path.join(generated, `v${version}.ts`)
      writeFileSync(file, `import '${path.join(fixture, 'exampleContract')}'\n${snippet}\n`)
      return file
    })
    writeFileSync(
      path.join(generated, 'ItemMenuItem.ts'),
      "import type { RunPiece } from '@ynput/ayon-addon'\n" +
        "const run: RunPiece<'example.itemMenuItem'> = (context) => void context.entities\n" +
        'export default run\n',
    )
    writeFileSync(
      path.join(generated, 'tsconfig.json'),
      JSON.stringify({ extends: path.join(fixture, 'tsconfig.json'), files }),
    )
    const snippets = tsc(path.join(generated, 'tsconfig.json'))
    expect(snippets.output).toBe('')
    expect(snippets.status).toBe(0)
  } finally {
    rmSync(generated, { recursive: true, force: true })
  }
})

test('the CLI finds the slots of the contract packages among the dependencies', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'addon-contract-'))
  const install = (name: string, pkg: object, files: Record<string, string> = {}) => {
    const dir = path.join(root, 'node_modules', name)
    mkdirSync(dir, { recursive: true })
    writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name, type: 'module', ...pkg }))
    Object.entries(files).forEach(([file, text]) => writeFileSync(path.join(dir, file), text))
  }
  writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({
      dependencies: { contract: '1', plain: '1', missing: '1' },
      devDependencies: { broken: '1', notlisted: '1' },
    }),
  )
  const slotsJs = `export const slots = [{ name: '${SLOT}', version: 1, required: [], pieces: ['run'] }]`
  install('contract', { ayonAddon: { slots: './slots.js' } }, { 'slots.js': slotsJs })
  install('plain', {})
  install('broken', { ayonAddon: { slots: './slots.js' } }, { 'slots.js': 'export const other = 1' })

  const { slots, problems } = await readContractSlots(root)
  expect(slots.map((s) => [s.name, s.package])).toEqual([[SLOT, 'contract']])
  expect(problems).toEqual([
    { reason: 'broken: its slots failed to load: ./slots.js does not export a "slots" list' },
  ])
})
