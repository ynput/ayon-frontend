// `ayon-addon open`: what counts as the contribution being shown, which menus it opens, where it
// looks for playwright, and how the dev shell tracks the contribution's pieces.
import { expect, test } from '@playwright/test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import os from 'os'
import path from 'path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  expectedPiece,
  menuOpener,
  pieceProblems,
  playwrightLocations,
} from '../../addon-dev/src/openChecks'
import type { PieceStatus } from '../../addon-dev/src/openChecks'
import { trackContribution } from '../../addon-dev/shell/src/tracking'
import type { PieceEvent } from '../../addon-dev/shell/src/tracking'

const status = (patch: Partial<PieceStatus>): PieceStatus => ({
  found: true,
  tracked: [],
  mounted: {},
  everMounted: [],
  runs: 0,
  ...patch,
})

test('a component or a cell must be mounted; a tab that stays a button fails', () => {
  expect(expectedPiece(['component', 'run'])).toBe('component')
  expect(expectedPiece(['cell'])).toBe('cell')
  expect(expectedPiece(['run'])).toBeUndefined()

  const tab = status({ tracked: ['component'] })
  expect(pieceProblems('detailsPanel.tab', 'notes', tab)).toEqual([
    expect.stringContaining('its component is not rendered: it never mounted'),
  ])
  expect(pieceProblems('detailsPanel.tab', 'notes', { ...tab, mounted: { component: 1 } })).toEqual(
    [],
  )
  expect(
    pieceProblems('detailsPanel.tab', 'notes', {
      ...tab,
      mounted: { component: 0 },
      everMounted: ['component'],
    }),
  ).toEqual([expect.stringContaining('mounted, then unmounted')])

  const column = status({ tracked: ['cell'] })
  expect(pieceProblems('tableColumn', 'cost', column)).toEqual([expect.stringContaining('no cell')])
  expect(pieceProblems('tableColumn', 'cost', { ...column, mounted: { cell: 3 } })).toEqual([])
})

test('a contribution the manifest lacks, and --run that never ran, are problems', () => {
  expect(pieceProblems('detailsPanel.tab', 'nope', status({ found: false }))).toEqual([
    'the addon\'s manifest has no contribution "nope" to detailsPanel.tab',
  ])
  const item = status({ tracked: ['run'] })
  expect(pieceProblems('detailsPanel.menuItem', 'copy', item)).toEqual([])
  expect(pieceProblems('detailsPanel.menuItem', 'copy', item, true)).toEqual([
    '--run: its run piece was not called',
  ])
  expect(pieceProblems('detailsPanel.menuItem', 'copy', { ...item, runs: 1 }, true)).toEqual([])
})

test('menu slots name the button or cell that opens their menu', () => {
  expect(menuOpener('detailsPanel.menuItem')).toEqual({
    selector: '[data-ayon-trigger="detailsPanel.menuItem"]',
    button: 'left',
  })
  expect(menuOpener('entityMenuItem')).toEqual({
    selector: '[data-shell-surface="table"] td',
    button: 'right',
  })
  expect(menuOpener('detailsPanel.tab')).toBeUndefined()
})

test('playwright is looked for in the addon, next to addon-dev, then the workbench frontend', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'addon-open-'))
  try {
    const root = path.join(dir, 'repos', 'ayon-notes', 'frontend')
    mkdirSync(root, { recursive: true })
    const self = 'file:///opt/addon-dev/dist/browse.js'
    // not a workbench yet
    expect(playwrightLocations(root, self)).toEqual([
      path.join(root, 'package.json'),
      '/opt/addon-dev/dist/browse.js',
    ])

    writeFileSync(path.join(dir, 'mani.yaml'), '')
    mkdirSync(path.join(dir, 'repos', 'ayon-frontend'), { recursive: true })
    writeFileSync(path.join(dir, 'repos', 'ayon-frontend', 'package.json'), '{}')
    expect(playwrightLocations(root, self)).toEqual([
      path.join(root, 'package.json'),
      '/opt/addon-dev/dist/browse.js',
      path.join(dir, 'repos', 'ayon-frontend', 'package.json'),
    ])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('the shell wraps only the opened contribution, and its pieces report what they do', async () => {
  const Tab = ({ label }: { label: string }) => createElement('b', null, label)
  const run = () => 'ran'
  const manifest = {
    contributes: [
      { slot: 'detailsPanel.tab', id: 'notes', component: async () => ({ default: Tab }) },
      { slot: 'detailsPanel.menuItem', id: 'copy', run: async () => ({ default: run }) },
    ],
  }
  const events: PieceEvent[] = []

  const none = trackContribution(manifest, 'detailsPanel.tab', 'other', (e) => events.push(e))
  expect(none).toEqual({ manifest, found: false, pieces: [] })

  const tab = trackContribution(manifest, 'detailsPanel.tab', 'notes', (e) => events.push(e))
  expect(tab.found).toBe(true)
  expect(tab.pieces).toEqual(['component'])
  const tracked = tab.manifest as typeof manifest
  expect(tracked.contributes[1]).toBe(manifest.contributes[1])
  const Wrapped = ((await tracked.contributes[0].component!()) as { default: typeof Tab }).default
  expect(Wrapped).not.toBe(Tab)
  // renders the piece as it is (effects, and so the mount report, only run in a browser)
  expect(renderToStaticMarkup(createElement(Wrapped, { label: 'Notes' }))).toBe('<b>Notes</b>')

  const item = trackContribution(manifest, 'detailsPanel.menuItem', 'copy', (e) => events.push(e))
  const runPiece = (
    (await (item.manifest as typeof manifest).contributes[1].run!()) as { default: typeof run }
  ).default
  expect(runPiece()).toBe('ran')
  expect(events).toEqual([{ piece: 'run', event: 'run' }])
})
