// Previews of other addons' slots: a contract package's previews.js, as `ayon-addon check` reads it
// and the dev shell renders contributions with it.
import { expect, test } from '@playwright/test'
import { cpSync, mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { checkPreviews } from '../../addon-dev/src/contractPreviews'
import {
  contractsCode,
  findContractPackages,
  readContractPreviews,
  readContractSlots,
} from '../../addon-dev/src/contractSlots'
import {
  buildContract,
  contractAreas,
  contractManifests,
  noPreviewsNote,
} from '../../addon-dev/shell/src/contractModel'
import {
  getRegistry,
  registerManifests,
  setManifestsLoading,
  unregisterAddon,
} from '../../addon/src/registry'
import * as exampleSlots from './fixtures/addon-contract-example/slots.js'
import * as examplePreviews from './fixtures/addon-contract-example/previews.js'

const FIXTURE = path.join(__dirname, 'fixtures', 'addon-contract-example')
const PACKAGE = '@ynput/ayon-addon-example'
const DECLARED = ['example.cardBadge', 'example.cardMenuItem', 'example.boardDialog']

// an addon frontend with the example contract package and React installed (in node_modules:
// Playwright compiles the files it loads from elsewhere to CommonJS)
const addonRoot = (extra: Record<string, Record<string, string>> = {}) => {
  const root = mkdtempSync(path.join(tmpdir(), 'addon-previews-'))
  const deps = Object.fromEntries([PACKAGE, ...Object.keys(extra)].map((name) => [name, '1']))
  writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({ name: 'contributor', devDependencies: deps }),
  )
  cpSync(FIXTURE, path.join(root, 'node_modules', PACKAGE), { recursive: true })
  symlinkSync(
    path.dirname(require.resolve('react/package.json')),
    path.join(root, 'node_modules', 'react'),
  )
  for (const [name, files] of Object.entries(extra)) {
    const dir = path.join(root, 'node_modules', name)
    mkdirSync(dir, { recursive: true })
    for (const [file, text] of Object.entries(files)) writeFileSync(path.join(dir, file), text)
  }
  return root
}

const loaded = () =>
  buildContract(
    { package: PACKAGE, entries: { slots: './slots.js', previews: './previews.js' } },
    { slots: exampleSlots.slots, previews: examplePreviews.previews },
  )

test('valid previews have no problems', () => {
  expect(checkPreviews(examplePreviews.previews, DECLARED)).toEqual([])
})

test('check reports what is wrong in previews', () => {
  expect(checkPreviews(undefined, DECLARED, './previews.js')).toEqual([
    { reason: './previews.js does not export "previews"' },
  ])
  expect(checkPreviews([], DECLARED)).toEqual([
    { reason: '"previews" must be an object keyed by slot name, not a list' },
  ])
  const problems = checkPreviews(
    {
      'example.unknown': { cases: [{ label: 'x', context: {} }] },
      'example.cardBadge': { frame: 'div', cases: [] },
      'example.cardMenuItem': {
        cases: [{ label: '', context: {} }, { label: 'ok', context: [] }, 3],
      },
      'example.boardDialog': null,
    },
    DECLARED,
  )
  expect(problems).toEqual([
    {
      slot: 'example.unknown',
      reason:
        'not a slot of this package (it declares example.cardBadge, example.cardMenuItem, example.boardDialog)',
    },
    { slot: 'example.cardBadge', reason: 'frame must be a component (a function), not string' },
    { slot: 'example.cardBadge', reason: 'cases must be a list with at least one case' },
    { slot: 'example.cardMenuItem', reason: 'case 1: label must be a string' },
    { slot: 'example.cardMenuItem', reason: 'case 2: context must be an object, not a list' },
    { slot: 'example.cardMenuItem', reason: 'case 3 must be an object, not number' },
    { slot: 'example.boardDialog', reason: 'must be an object with "cases", not null' },
  ])
})

test('the CLI reads the previews of the contract packages among the dependencies', async () => {
  const root = addonRoot({
    broken: {
      'package.json': JSON.stringify({
        name: 'broken',
        type: 'module',
        ayonAddon: { slots: './slots.js', previews: './previews.js' },
      }),
      'slots.js': `export const slots = [{ name: 'other.item', version: 1, required: [], pieces: ['run'] }]`,
      'previews.js': `export const previews = { 'other.item': { cases: [] }, 'example.cardBadge': { cases: [] } }`,
    },
    missing: {
      'package.json': JSON.stringify({
        name: 'missing',
        ayonAddon: { slots: './slots.js', previews: 1 },
      }),
    },
  })
  const found = findContractPackages(root)
  expect(found.packages.map((p) => [p.name, p.entries])).toEqual([
    [PACKAGE, { slots: './slots.js', previews: './previews.js' }],
    ['broken', { slots: './slots.js', previews: './previews.js' }],
    ['missing', { slots: './slots.js' }],
  ])
  expect(found.packages[0].previews).toBe(path.join(root, 'node_modules', PACKAGE, 'previews.js'))
  expect(found.problems).toEqual([
    { reason: 'missing: ./slots.js ("ayonAddon.slots") does not exist' },
    { reason: 'missing: "ayonAddon.previews" must be a path' },
  ])

  const { slots } = await readContractSlots(root)
  const result = await readContractPreviews(root, slots)
  expect(result.previews).toEqual([
    {
      package: PACKAGE,
      slots: [
        { name: 'example.cardBadge', cases: 2 },
        { name: 'example.cardMenuItem', cases: 1 },
      ],
    },
    { package: 'broken', slots: [{ name: 'other.item', cases: 0 }] },
  ])
  // a package may only give previews of the slots it declares
  expect(result.problems).toEqual([
    { slot: 'other.item', reason: 'broken previews: cases must be a list with at least one case' },
    {
      slot: 'example.cardBadge',
      reason: 'broken previews: not a slot of this package (it declares other.item)',
    },
  ])
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

test('the shell shows component slots in their frame, menu slots as menus', () => {
  const contract = loaded()
  expect(contract.problems).toEqual([])
  expect(contract.addons).toEqual(['example'])
  const [badge, menuItem, dialog] = contract.slots
  expect([badge.kind, menuItem.kind, dialog.kind]).toEqual(['component', 'menu', 'other'])
  expect(badge.preview?.cases.map((c) => c.label)).toEqual([
    'A card in progress',
    'A finished card',
  ])
  expect(menuItem.preview?.frame).toBeUndefined()
  expect(dialog.preview).toBeUndefined()
  expect(noPreviewsNote(dialog, contract)).toBe(
    `${PACKAGE} has no previews for example.boardDialog: add its cases to ./previews.js in that package.`,
  )

  // the frame puts the contribution where the declaring addon would
  const Frame = badge.preview!.frame!
  const html = renderToStaticMarkup(
    createElement(
      Frame,
      { context: badge.preview!.cases[0].context },
      createElement('em', null, 'badge'),
    ),
  )
  expect(html).toContain('data-example-card="c1"')
  expect(html).toContain('<strong>Layout</strong><em>badge</em>')

  expect(contractAreas([contract])).toEqual([
    {
      label: 'example',
      icon: 'extension',
      package: PACKAGE,
      sections: [
        {
          slots: [
            { slot: 'example.cardBadge', label: 'cardBadge' },
            { slot: 'example.cardMenuItem', label: 'cardMenuItem' },
            { slot: 'example.boardDialog', label: 'boardDialog' },
          ],
        },
      ],
    },
  ])
})

test('a package without previews says how to add them', () => {
  const contract = buildContract(
    { package: PACKAGE, entries: { slots: './slots.js' } },
    { slots: exampleSlots.slots },
  )
  expect(contract.slots.every((slot) => !slot.preview)).toBe(true)
  expect(noPreviewsNote(contract.slots[0], contract)).toContain(
    'add a previews.js with cases for example.cardBadge',
  )
})

test('broken previews are reported, their valid cases still render', () => {
  const contract = buildContract(
    { package: PACKAGE, entries: { slots: './slots.js', previews: './previews.js' } },
    {
      slots: exampleSlots.slots,
      previews: {
        'example.cardBadge': { frame: 1, cases: [{ label: 'ok', context: {} }, { label: 2 }] },
      },
    },
  )
  expect(contract.problems).toEqual([
    'example.cardBadge: frame must be a component (a function), not number',
    'example.cardBadge: case 2: label must be a string',
    'example.cardBadge: case 2: context must be an object, not undefined',
  ])
  expect(contract.slots[0].preview).toEqual({
    frame: undefined,
    cases: [{ label: 'ok', context: {} }],
  })

  const failed = buildContract(
    { package: PACKAGE, entries: { slots: './slots.js', previews: './previews.js' } },
    { slots: exampleSlots.slots, previewsError: 'Unexpected token' },
  )
  expect(failed.problems).toEqual(['its previews failed to load: Unexpected token'])
})

test.describe('registry', () => {
  test.afterEach(() => {
    unregisterAddon('contributor')
    unregisterAddon('example')
  })

  test("the shell registers the declaring addon's slots, so contributions to them apply", () => {
    setManifestsLoading(false)
    const contributor = { name: 'contributor', version: '1.0.0', remote: 'contributor' }
    const run = () => Promise.resolve({ default: () => undefined })
    const manifest = {
      contributes: [
        {
          slot: 'example.cardMenuItem',
          slotVersion: 1,
          id: 'log',
          label: 'Log',
          icon: 'timer',
          run,
        },
      ],
    }
    registerManifests([
      ...(contractManifests([loaded()], contributor.name) as never[]),
      { addon: contributor, manifest },
    ])
    expect(getRegistry().contributions.map((c) => c.key)).toEqual(['contributor.log'])
    expect(getRegistry().slots.map((s) => [s.name, s.owner.name])).toEqual(
      DECLARED.map((name) => [name, 'example']),
    )
    // the declaring addon's own shell: its manifest declares them
    expect(contractManifests([loaded()], 'example')).toEqual([])
  })
})
