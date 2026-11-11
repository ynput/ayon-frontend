// Previews of other addons' slots: a contract package's previews.js (scenes), as `ayon-addon check`
// reads it and the dev shell renders it.
import { expect, test } from '@playwright/test'
import { cpSync, mkdirSync, mkdtempSync, realpathSync, symlinkSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { createElement } from 'react'
import { createServer } from 'vite'
import {
  checkPreviews,
  decodeSceneValues,
  encodeSceneValues,
  sceneDefaults,
  validScenes,
} from '../../addon-dev/src/contractPreviews'
import {
  contractsCode,
  findContractPackages,
  loadPreviewsModule,
  readContractPreviews,
  readContractSlots,
} from '../../addon-dev/src/contractSlots'
import { DEDUPE } from '../../addon-dev/src/packages'
import { buildContract, contractManifests, noSceneNote, scenesOf, slotLabel } from '../../addon-dev/shell/src/contractModel'
import { buildPlaces, normalizeParams } from '../../addon-dev/shell/src/places'
import { provideHost } from '../../addon/src/hostBridge'
import type { DevSlots } from '../../addon/src/hostBridge'
import { checkSlotDeclarations } from '../../addon/src/validate'
import * as sdk from '../../addon/src/index'
import { loadPiece } from '../../addon/src/pieces'
import {
  getRegistry,
  registerManifests,
  setManifestsLoading,
  unregisterAddon,
} from '../../addon/src/registry'
import { renderToHtml, toReactComponent } from './support/render'
import * as exampleSlots from './fixtures/addon-contract-example/slots.js'

const REPO = path.resolve(__dirname, '../..')
const FIXTURE = path.join(__dirname, 'fixtures', 'addon-contract-example')
const PREVIEWS = path.join(FIXTURE, 'previews.js')
const PACKAGE = '@ynput/ayon-addon-example'
const DECLARED = ['example.cardBadge', 'example.cardMenuItem', 'example.cardEndItem', 'example.boardDialog']

const packageDir = (name: string) => path.dirname(require.resolve(`${name}/package.json`))

// an addon frontend with the example contract package, React and Vite installed
const addonRoot = (extra: Record<string, Record<string, string>> = {}) => {
  const root = mkdtempSync(path.join(tmpdir(), 'addon-previews-'))
  const deps = Object.fromEntries([PACKAGE, ...Object.keys(extra)].map((name) => [name, '1']))
  writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'contributor', devDependencies: deps }))
  cpSync(FIXTURE, path.join(root, 'node_modules', PACKAGE), { recursive: true })
  for (const name of ['react', 'vite']) symlinkSync(packageDir(name), path.join(root, 'node_modules', name))
  for (const [name, files] of Object.entries(extra)) {
    const dir = path.join(root, 'node_modules', name)
    mkdirSync(dir, { recursive: true })
    for (const [file, text] of Object.entries(files)) writeFileSync(path.join(dir, file), text)
  }
  return root
}

// the fixture in Node with a stand-in for the SDK, as `ayon-addon check` loads it
const examplePreviews = async () => (await loadPreviewsModule(REPO, PREVIEWS)).previews as unknown[]

const exampleContract = async () =>
  buildContract(
    { package: PACKAGE, entries: { slots: './slots.js', previews: './previews.js' } },
    { slots: exampleSlots.slots, previews: await examplePreviews() },
  )

test('valid previews have no problems', async () => {
  expect(checkPreviews(await examplePreviews(), DECLARED)).toEqual([])
})

test('check reports what is wrong in previews', () => {
  const component = () => null
  expect(checkPreviews(undefined, DECLARED, './previews.js')).toEqual([
    { reason: './previews.js does not export "previews"' },
  ])
  expect(checkPreviews({}, DECLARED)).toEqual([{ reason: '"previews" must be a list of scenes, not object' }])
  const problems = checkPreviews(
    [
      { id: 'a', label: 'A', slots: ['example.unknown'], fields: [], component },
      { id: 'a', label: '', slots: [], fields: {}, component: 'div' },
      3,
      {
        id: 'fields',
        label: 'Fields',
        slots: ['example.cardBadge'],
        component,
        fields: [
          { key: 'n', label: 'N', type: 'number', default: '1' },
          { key: 'n', label: 'N again', type: 'text' },
          { key: 's', label: 'S', type: 'select', options: [], default: 'x' },
          { key: 'p', label: 'P', type: 'project', default: null },
          { key: 'e', label: 'E', type: 'entity', entityType: 'shot', project: 'n' },
          { key: 'k', label: 'K', type: 'pick' },
          { label: 'no key', type: 'color' },
        ],
      },
    ],
    DECLARED,
  )
  expect(problems).toEqual([
    {
      scene: 'a',
      reason:
        '"example.unknown" is not a slot of this package (it declares example.cardBadge, example.cardMenuItem, example.cardEndItem, example.boardDialog)',
    },
    { scene: 'a', reason: 'id is not unique' },
    { scene: 'a', reason: 'label must be a string' },
    { scene: 'a', reason: 'slots must be a list of the slots it renders' },
    { scene: 'a', reason: 'component must be a component (a function), not string' },
    { scene: 'a', reason: 'fields must be a list (empty for none)' },
    { scene: 'scene 3', reason: 'must be an object, not number' },
    { scene: 'fields', reason: 'field "n": default must be a number, not string' },
    { scene: 'fields', reason: 'field "n": key is not unique' },
    { scene: 'fields', reason: 'field "s": options must be a list with at least one option' },
    { scene: 'fields', reason: 'field "s": default "x" is not one of the options' },
    { scene: 'fields', reason: 'field "p": default null ("No project") needs optional: true' },
    { scene: 'fields', reason: 'field "e": entityType must be one of task, folder, product, version' },
    { scene: 'fields', reason: 'field "e": project must be the key of a project field of the scene, not "n"' },
    { scene: 'fields', reason: 'field "k": load must be a function, not undefined' },
    { scene: 'fields', reason: 'field 7: key must be a string' },
    {
      scene: 'fields',
      reason: 'field 7: type must be one of text, number, boolean, select, multiselect, json, project, entity, pick, not "color"',
    },
  ])
  // what still renders: the scenes with an id, a label, a component and slots of the package
  const valid = validScenes(
    [
      { id: 'a', label: 'A', slots: ['example.cardBadge', 'example.unknown'], fields: [], component },
      { id: 'b', label: 'B', slots: ['example.unknown'], fields: [], component },
    ],
    DECLARED,
  )
  expect(valid.map((scene) => [scene.id, scene.slots])).toEqual([['a', ['example.cardBadge']]])
})

test('values start from the defaults; the changed ones go in the URL', async () => {
  const [scene] = validScenes(await examplePreviews(), DECLARED)
  expect(scene.fields.map((field) => field.key)).toEqual([
    'project',
    'title',
    'status',
    'estimate',
    'pinned',
    'tags',
    'attrib',
    'task',
    'card',
  ])
  expect(sceneDefaults(scene.fields, 'demo')).toEqual({
    project: null, // optional, without a default
    title: 'Layout',
    status: 'in_progress',
    estimate: null,
    pinned: false,
    tags: [],
    attrib: { priority: 'high' },
    task: null,
    card: null,
  })
  // a project field that must have one starts with the shell's project
  expect(sceneDefaults([{ key: 'p', label: 'P', type: 'project' }], 'demo')).toEqual({ p: 'demo' })
  expect(sceneDefaults([{ key: 'p', label: 'P', type: 'project', default: 'other' }], 'demo')).toEqual({
    p: 'other',
  })

  const changed = { project: 'demo', attrib: { priority: 'low', fps: 25 }, task: { id: 't1', name: 'comp' } }
  const param = encodeSceneValues(changed)
  expect(new URLSearchParams({ ctxValues: param! }).get('ctxValues')).toBe(param)
  expect(decodeSceneValues(param)).toEqual(changed)
  expect(encodeSceneValues({})).toBeUndefined()
  expect(decodeSceneValues('[1]')).toBeUndefined()
  expect(decodeSceneValues('{oops')).toBeUndefined()
})

test('the CLI reads the scenes of the contract packages among the dependencies', async () => {
  const root = addonRoot({
    broken: {
      'package.json': JSON.stringify({
        name: 'broken',
        type: 'module',
        ayonAddon: { slots: './slots.js', previews: './previews.js' },
      }),
      'slots.js': `export const slots = [{ name: 'other.item', version: 1, required: [], pieces: ['run'] }]`,
      'previews.js': `export const previews = [{ id: 'x', label: 'X', slots: ['example.cardBadge'], fields: [], component: () => null }]`,
    },
    syntax: {
      'package.json': JSON.stringify({ name: 'syntax', type: 'module', ayonAddon: { slots: './slots.js', previews: './previews.js' } }),
      'slots.js': `export const slots = []`,
      'previews.js': `export const previews = [`,
    },
    missing: {
      'package.json': JSON.stringify({ name: 'missing', ayonAddon: { slots: './slots.js', previews: 1 } }),
    },
  })
  const found = findContractPackages(root)
  expect(found.packages.map((p) => [p.name, p.entries])).toEqual([
    [PACKAGE, { slots: './slots.js', previews: './previews.js' }],
    ['broken', { slots: './slots.js', previews: './previews.js' }],
    ['syntax', { slots: './slots.js', previews: './previews.js' }],
    ['missing', { slots: './slots.js' }],
  ])
  expect(found.problems).toEqual([
    { reason: 'missing: ./slots.js ("ayonAddon.slots") does not exist' },
    { reason: 'missing: "ayonAddon.previews" must be a path' },
  ])

  const { slots } = await readContractSlots(root)
  const result = await readContractPreviews(root, slots)
  // the example's previews import @ynput/ayon-addon and React: they load in Node all the same
  expect(result.previews).toEqual([
    {
      package: PACKAGE,
      scenes: [
        {
          id: 'card',
          label: 'A card on the board',
          slots: ['example.cardBadge', 'example.cardMenuItem', 'example.cardEndItem'],
        },
      ],
    },
    { package: 'broken', scenes: [] },
  ])
  expect(result.problems).toHaveLength(2)
  // a package may only render the slots it declares
  expect(result.problems[0]).toEqual({
    reason: 'broken previews, x: "example.cardBadge" is not a slot of this package (it declares other.item)',
  })
  expect(result.problems[1].reason).toMatch(/^syntax: its previews failed to load: /)
})

test('the dev server imports declarations and previews by file path', () => {
  const root = addonRoot()
  const dir = path.join(root, 'node_modules', PACKAGE)
  const code = contractsCode(root, 'contributor')
  expect(code).toContain(`package: "${PACKAGE}"`)
  expect(code).toContain(`slots: () => import(${JSON.stringify(path.join(dir, 'slots.js'))})`)
  expect(code).toContain(`previews: () => import(${JSON.stringify(path.join(dir, 'previews.js'))})`)
  expect(code).toContain('export const contractProblems = []')
})

// The previews import the SDK from wherever the contract package really is: with `link:` that is
// another repo, with its own node_modules. The addon's dev server must give them the addon's copy,
// or they'd have a registry of their own without the addon's contributions.
test("the dev server resolves a contract package's SDK and React to the addon's", async () => {
  const fake = (dir: string, name: string) => {
    mkdirSync(dir, { recursive: true })
    writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name, type: 'module', main: 'index.js' }))
    writeFileSync(path.join(dir, 'index.js'), 'export {}')
  }
  const root = mkdtempSync(path.join(tmpdir(), 'addon-dedupe-'))
  writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'contributor' }))
  // the contract package in another checkout, with its own SDK and React
  const contract = mkdtempSync(path.join(tmpdir(), 'contract-checkout-'))
  for (const name of ['@ynput/ayon-addon', 'react']) {
    fake(path.join(root, 'node_modules', name), name)
    fake(path.join(contract, 'node_modules', name), name)
  }
  writeFileSync(path.join(contract, 'previews.js'), `import '@ynput/ayon-addon'\nexport const previews = []`)
  symlinkSync(contract, path.join(root, 'node_modules', PACKAGE))
  const importer = path.join(realpathSync(contract), 'previews.js')

  const resolveFrom = async (dedupe: string[]) => {
    const server = await createServer({
      root,
      configFile: false,
      logLevel: 'silent',
      resolve: { dedupe },
      server: { middlewareMode: true, ws: false },
      optimizeDeps: { noDiscovery: true, include: [] },
    })
    try {
      const resolve = async (id: string) => (await server.pluginContainer.resolveId(id, importer))?.id
      return { sdk: await resolve('@ynput/ayon-addon'), react: await resolve('react') }
    } finally {
      await server.close()
    }
  }
  const inRoot = (name: string) => path.join(realpathSync(root), 'node_modules', name, 'index.js')
  expect(await resolveFrom(DEDUPE)).toEqual({ sdk: inRoot('@ynput/ayon-addon'), react: inRoot('react') })
  // without it: the other checkout's copies
  expect((await resolveFrom([])).sdk).toBe(path.join(realpathSync(contract), 'node_modules/@ynput/ayon-addon/index.js'))
})

test('the shell lists the scenes and finds the one for a contribution', async () => {
  const contract = await exampleContract()
  expect(contract.problems).toEqual([])
  expect(contract.addons).toEqual(['example'])
  expect(contract.scenes.map((scene) => [scene.key, scene.slots])).toEqual([
    [`${PACKAGE}:card`, ['example.cardBadge', 'example.cardMenuItem', 'example.cardEndItem']],
  ])
  const [card] = contract.scenes
  expect(scenesOf('example.cardMenuItem', [contract])).toEqual([card])
  expect(scenesOf('example.boardDialog', [contract])).toEqual([])
  // `ayon-addon open <slot> <id>`: the first place that renders the slot
  const places = buildPlaces({ ayonSlots: ['header.item'], contracts: [contract] })
  const surface = (search: string) => normalizeParams(search, places).get('surface')
  expect(surface('?slot=example.cardBadge')).toBe(card.key)
  expect(surface(`?scene=${encodeURIComponent(card.key)}`)).toBe(card.key)
  expect(surface('?slot=example.boardDialog')).toBe('other')
  expect(surface('?slot=header.item')).toBe('app-header')

  const dialog = contract.slots.find((slot) => slot.name === 'example.boardDialog')!
  expect(noSceneNote(dialog, contract)).toBe(
    `No preview scene in ${PACKAGE} renders example.boardDialog: add one to ./previews.js in that package.`,
  )
  const without = buildContract({ package: PACKAGE, entries: { slots: './slots.js' } }, { slots: exampleSlots.slots })
  expect(without.scenes).toEqual([])
  expect(noSceneNote(without.slots[0], without)).toContain('the package has no previews')

  expect(places.find((place) => place.id === card.key)).toMatchObject({ label: card.label, source: PACKAGE })
})

test('broken previews are reported, their valid scenes still render', async () => {
  const contract = buildContract(
    { package: PACKAGE, entries: { slots: './slots.js', previews: './previews.js' } },
    {
      slots: exampleSlots.slots,
      previews: [
        {
          id: 'ok',
          label: 'OK',
          slots: ['example.cardBadge'],
          component: () => null,
          fields: [
            { key: 'a', label: 'A', type: 'text' },
            { key: 'b', label: 'B', type: 'select', options: [] },
          ],
        },
        { id: 'broken', label: 'Broken', slots: ['example.cardBadge'], fields: [] },
      ],
    },
  )
  expect(contract.problems).toEqual([
    'ok: field "b": options must be a list with at least one option',
    'broken: component must be a component (a function), not undefined',
  ])
  expect(contract.scenes.map((scene) => [scene.id, scene.fields.map((f) => f.key)])).toEqual([['ok', ['a']]])

  const failed = buildContract(
    { package: PACKAGE, entries: { slots: './slots.js', previews: './previews.js' } },
    { slots: exampleSlots.slots, previewsError: 'Unexpected token' },
  )
  expect(failed.problems).toEqual(['its previews failed to load: Unexpected token'])
})

test.describe('registry', () => {
  const contributor = { name: 'contributor', version: '1.0.0', remote: 'contributor' }
  test.afterEach(() => {
    unregisterAddon('contributor')
    unregisterAddon('example')
  })

  test("the shell registers the declaring addon's slots, so contributions to them apply", async () => {
    setManifestsLoading(false)
    const run = () => Promise.resolve({ default: () => undefined })
    const manifest = {
      contributes: [{ slot: 'example.cardMenuItem', slotVersion: 1, id: 'log', label: 'Log', icon: 'timer', run }],
    }
    registerManifests([
      ...(contractManifests([await exampleContract()], contributor.name) as never[]),
      { addon: contributor, manifest },
    ])
    expect(getRegistry().contributions.map((c) => c.key)).toEqual(['contributor.log'])
    expect(getRegistry().slots.map((s) => [s.name, s.owner.name])).toEqual(DECLARED.map((name) => [name, 'example']))
    // the declaring addon's own shell: its manifest declares them
    expect(contractManifests([await exampleContract()], 'example')).toEqual([])
  })

  test("a scene renders the addon's contributions to its slots, with contexts from its values", async () => {
    setManifestsLoading(false)
    provideHost({ getUser: () => ({ name: 'admin' }), useUser: () => ({ name: 'admin' }) } as never)
    const contexts: unknown[] = []
    const Badge = (props: { card: { status: string } }) => {
      contexts.push(props)
      return `badge:${props.card.status}`
    }
    const component = () => Promise.resolve({ default: Badge })
    await loadPiece(component)
    registerManifests([
      ...(contractManifests([await exampleContract()], contributor.name) as never[]),
      {
        addon: contributor,
        manifest: {
          contributes: [{ slot: 'example.cardBadge', slotVersion: 1, id: 'timer', label: 'Timer', component }],
        },
      },
    ])
    // the scene with the SDK the addon uses (the dev server dedupes it to the addon's copy)
    const { previews } = await loadPreviewsModule(REPO, PREVIEWS, {
      '@ynput/ayon-addon': {
        ...sdk,
        SlotOutlet: toReactComponent(sdk.SlotOutlet),
        useContextMenu: () => () => undefined,
      },
    })
    const contract = buildContract(
      { package: PACKAGE, entries: { slots: './slots.js', previews: './previews.js' } },
      { slots: exampleSlots.slots, previews },
    )
    const [scene] = contract.scenes
    const values = { ...sceneDefaults(scene.fields, 'demo'), project: 'demo', status: 'done' }
    const html = renderToHtml(scene.component as never, { values, setValues: () => undefined })
    expect(html).toContain('data-example-card="c1"')
    expect(html).toContain('<strong>Layout</strong>badge:done')
    expect(contexts[0]).toMatchObject({ projectName: 'demo', card: { id: 'c1', title: 'Layout', status: 'done' } })
  })
})

test('a slot has a title for people: its label, or its name in words', async () => {
  const contract = await exampleContract()
  expect(contract.slots.map((slot) => [slot.name, slot.label])).toEqual([
    ['example.cardBadge', 'Card badge'],
    ['example.cardMenuItem', 'Card menu item'],
    ['example.cardEndItem', 'Card end item'],
    ['example.boardDialog', 'Board dialog'],
  ])
  const [scene] = buildPlaces({ ayonSlots: [], contracts: [contract] })
  expect(scene.slots[1]).toMatchObject({ slot: 'example.cardMenuItem', label: 'Card menu item' })
  expect(slotLabel('example.taskEventStart')).toBe('Task event start')
  expect(slotLabel('example.openURLItem')).toBe('Open url item')
  expect(slotLabel('example.end_item')).toBe('End item')
  expect(slotLabel('example.cardBadge', '  ')).toBe('Card badge')
  expect(slotLabel('example.cardBadge', 'Badge on a card')).toBe('Badge on a card')
})

test('a declaration may have a label, a non-empty string', () => {
  const addon = { name: 'example', version: '1.0.0', remote: 'example' }
  const declare = (label: unknown) =>
    checkSlotDeclarations(addon, {
      slots: [{ name: 'example.cardBadge', version: 1, label, required: [], pieces: ['component'] }],
    })
  expect(declare('Card badge').slots.map((slot) => slot.label)).toEqual(['Card badge'])
  expect(declare(undefined).skipped).toEqual([])
  for (const label of ['', '  ', 3, null]) {
    expect(declare(label).skipped).toEqual([
      { addon: 'example', slot: 'example.cardBadge', reason: 'label must be a non-empty string' },
    ])
  }
})

// A contract package may ship previews.js as a build of the declaring addon's own components,
// with React, the SDK, AYON's components, styled-components and the DOM as externals. `check` only
// needs the scenes' metadata: it stands in for what Node can't run or the addon hasn't installed.
test('check reads the scenes of a previews.js built with externals', async () => {
  const root = addonRoot()
  const dir = path.join(root, 'node_modules', PACKAGE)
  writeFileSync(path.join(dir, 'previews.css'), '.bar { color: red }')
  writeFileSync(
    path.join(dir, 'chunk-bar.js'),
    `import styled from 'styled-components'
export const Bar = styled.div\`display: flex;\``,
  )
  writeFileSync(
    path.join(dir, 'previews.js'),
    `import './previews.css'
import { jsx } from 'react/jsx-runtime'
import { createContext, Component } from 'react'
import { createPortal } from 'react-dom'
import { createRoot } from 'react-dom/client'
import styled, { css, createGlobalStyle } from 'styled-components'
import { Button, Icon } from '@ynput/ayon-react-components'
import { useGetProjectQuery } from '@ynput/ayon-frontend-shared/api'
import * as ayonAddon from '@ynput/ayon-addon'
import { format } from 'not-installed-date-lib'
import { Bar } from './chunk-bar.js'

const Theme = createContext(null)
const Global = createGlobalStyle\`body { margin: 0 }\`
const Title = styled(Button)\`\${css\`color: red;\`}\`
class Boundary extends Component {}
const Lazy = () => import('./chunk-bar.js')
const Outlet = ayonAddon.SlotOutlet ?? (() => null)
export const previews = [
  {
    id: 'bar',
    label: \`A bar \${format}\`,
    slots: ['example.cardBadge', 'example.cardEndItem'],
    fields: [],
    component: (props) => jsx(Bar, { children: [jsx(Title, {}), jsx(Outlet, props)] }),
  },
]
export const unused = [Theme, Global, Boundary, Lazy, createPortal, createRoot, Icon, useGetProjectQuery]`,
  )
  const { slots } = await readContractSlots(root)
  const result = await readContractPreviews(root, slots)
  expect(result.problems).toEqual([])
  expect(result.previews).toEqual([
    { package: PACKAGE, scenes: [{ id: 'bar', label: 'A bar ', slots: ['example.cardBadge', 'example.cardEndItem'] }] },
  ])
})

test.describe('Show slots (the dev shell only)', () => {
  const contributor = { name: 'contributor', version: '1.0.0', remote: 'contributor' }
  const SlotOutlet = toReactComponent(sdk.SlotOutlet)
  const Outlet: DevSlots['Outlet'] = ({ slot, count, children }) =>
    createElement('i', { 'data-slot': slot, 'data-count': count }, children)
  const placeholder = { id: 'placeholder', label: 'No contributions', icon: 'extension', command: () => undefined }
  const devSlots: DevSlots = { Outlet, menuPlaceholder: () => placeholder }

  test.beforeEach(async () => {
    setManifestsLoading(false)
    provideHost({ getUser: () => ({ name: 'admin' }), useUser: () => ({ name: 'admin' }) } as never)
    const component = () => Promise.resolve({ default: () => 'badge' })
    await loadPiece(component)
    registerManifests([
      ...(contractManifests([await exampleContract()], contributor.name) as never[]),
      {
        addon: contributor,
        manifest: {
          contributes: [
            { slot: 'example.cardBadge', slotVersion: 1, id: 'timer', label: 'Timer', component },
            {
              slot: 'example.cardMenuItem',
              slotVersion: 1,
              id: 'log',
              label: 'Log',
              icon: 'timer',
              run: () => Promise.resolve({ default: () => undefined }),
            },
          ],
        },
      },
    ])
  })
  test.afterEach(() => {
    provideHost({ devSlots: undefined })
    unregisterAddon('contributor')
    unregisterAddon('example')
  })

  const outlet = (slot: string) => renderToHtml(SlotOutlet, { slot, context: {} })
  const menu = (slot: string) => {
    let items: unknown
    renderToHtml(() => {
      items = sdk.useSlotMenuItems(slot as never)({} as never)
      return null
    })
    return items as { top: { id: string }[]; bottom: { id: string }[] }
  }

  test('without the dev shell, slots render only their contributions', () => {
    expect(outlet('example.cardBadge')).toBe('badge')
    expect(outlet('example.cardEndItem')).toBe('')
    expect(menu('example.cardMenuItem')).toMatchObject({ top: [], bottom: [{ id: 'contributor.log' }] })
    expect(menu('example.boardDialog')).toEqual({ top: [], bottom: [] })
  })

  test('with it, every outlet is wrapped and an empty menu slot gets a placeholder', () => {
    provideHost({ devSlots })
    expect(outlet('example.cardBadge')).toBe('<i data-slot="example.cardBadge" data-count="1">badge</i>')
    expect(outlet('example.cardEndItem')).toBe('<i data-slot="example.cardEndItem" data-count="0"></i>')
    // a slot with items keeps them as they are
    expect(menu('example.cardMenuItem')).toMatchObject({ top: [], bottom: [{ id: 'contributor.log' }] })
    expect(menu('example.boardDialog')).toEqual({ top: [placeholder], bottom: [] })
    // the shell's toggle is off: no placeholder
    provideHost({ devSlots: { Outlet, menuPlaceholder: () => undefined } })
    expect(menu('example.boardDialog')).toEqual({ top: [], bottom: [] })
  })

  test('with it, each contribution is wrapped with its key and menus report theirs', () => {
    const built: unknown[] = []
    const Item: DevSlots['Item'] = ({ contribution, children }) =>
      createElement('b', { 'data-contribution': contribution }, children)
    provideHost({
      devSlots: {
        Outlet,
        Item,
        menuPlaceholder: () => undefined,
        menuBuilt: (slot, context, keys) => built.push([slot, context, keys]),
      },
    })
    expect(outlet('example.cardBadge')).toBe(
      '<i data-slot="example.cardBadge" data-count="1"><b data-contribution="contributor.timer">badge</b></i>',
    )
    expect(menu('example.cardMenuItem')).toMatchObject({ top: [], bottom: [{ id: 'contributor.log' }] })
    expect(built).toEqual([['example.cardMenuItem', {}, ['contributor.log']]])
  })
})
