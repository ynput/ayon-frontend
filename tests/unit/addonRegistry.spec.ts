import { expect, test } from '@playwright/test'
import { spawnSync } from 'child_process'
import path from 'path'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { checkManifest, formatSkipped } from '../../addon/src/validate'
import { menuItemsAt } from '../../addon/src/menus'
import { matchesShortcut, parseShortcut } from '../../addon/src/shortcuts'
import { useSlot } from '../../addon/src/useSlot'
import { SlotReactContext } from '../../addon/src/SlotContextInstance'

const addon = { name: 'my-addon', version: '1.0.0', remote: 'my_addon' }
const loader = () => Promise.resolve({ default: () => null })
const slots = {
  'test.page': { version: 1, required: ['title'], pieces: ['component'] },
  'test.menuItem': { version: 1, required: ['label'], pieces: ['run'], optionalPieces: ['when'] },
}

test('a manifest registers its contributions keyed by addon', () => {
  const { contributions, skipped } = checkManifest(
    addon,
    {
      contributes: [
        { slot: 'test.page', id: 'budget', title: 'Budget', component: loader },
        { slot: 'test.menuItem', id: 'send', label: 'Send', run: loader },
      ],
    },
    slots,
  )
  expect(skipped).toEqual([])
  expect(contributions.map((c) => [c.key, c.slot, c.addon.name])).toEqual([
    ['my-addon.budget', 'test.page', 'my-addon'],
    ['my-addon.send', 'test.menuItem', 'my-addon'],
  ])
})

// a newer addon on an older AYON: the rest of the addon still works
test('a contribution to an unknown slot is skipped and named', () => {
  const { contributions, skipped } = checkManifest(
    addon,
    {
      contributes: [
        { slot: 'future.slot', id: 'later', title: 'Later', component: loader },
        { slot: 'test.page', id: 'budget', title: 'Budget', component: loader },
      ],
    },
    slots,
  )
  expect(contributions.map((c) => c.key)).toEqual(['my-addon.budget'])
  expect(skipped).toHaveLength(1)
  expect(formatSkipped(skipped[0])).toBe(
    '[addon my-addon] skipped contribution "later" for slot "future.slot": this AYON version has no such slot',
  )
})

test('invalid ids, missing fields and pieces, and duplicates are skipped', () => {
  const { contributions, skipped } = checkManifest(
    addon,
    {
      contributes: [
        { slot: 'test.page', id: 'has-dash', title: 'A', component: loader },
        { slot: 'test.page', id: 'noTitle', component: loader },
        { slot: 'test.page', id: 'noComponent', title: 'B' },
        { slot: 'test.menuItem', id: 'badWhen', label: 'C', run: loader, when: true },
        { slot: 'test.page', id: 'ok', title: 'D', component: loader },
        { slot: 'test.page', id: 'ok', title: 'E', component: loader },
      ],
    },
    slots,
  )
  expect(contributions.map((c) => c.id)).toEqual(['ok'])
  expect(skipped.map((s) => [s.id, s.reason.split(':')[0]])).toEqual([
    ['has-dash', 'invalid id "has-dash"'],
    ['noTitle', 'missing title'],
    ['noComponent', "component must be a loader"],
    ['badWhen', 'when must be a loader'],
    ['ok', 'duplicate id in slot "test.page"'],
  ])
})

// the real page slots: access and viewType are checked when set
test('pages with an invalid access or view type are skipped', () => {
  const page = { slot: 'project.page', title: 'Budget', component: loader }
  const { contributions, skipped } = checkManifest(addon, {
    contributes: [
      { ...page, id: 'plain' },
      { ...page, id: 'withViews', viewType: 'my-addon.budget', access: 'manager' },
      { ...page, id: 'badViewType', viewType: 'my budget' },
      { ...page, id: 'badAccess', access: 'managers' },
      { ...page, slot: 'studio.page', id: 'numberViewType', viewType: 3 },
    ],
  })
  expect(contributions.map((c) => c.id)).toEqual(['plain', 'withViews'])
  expect(skipped.map((s) => [s.id, s.reason])).toEqual([
    ['badViewType', 'invalid viewType "my budget"'],
    ['badAccess', 'invalid access "managers"'],
    ['numberViewType', 'invalid viewType 3'],
  ])
})

test('menu items are placed at the top or bottom and sorted by order', () => {
  const items = [
    { key: 'a', position: 'top' as const, order: 2 },
    { key: 'b' },
    { key: 'c', position: 'top' as const },
    { key: 'd', position: 'bottom' as const, order: -1 },
    { key: 'e', position: 'top' as const, order: 2 },
  ]
  expect(menuItemsAt(items, 'top').map((i) => i.key)).toEqual(['c', 'a', 'e'])
  expect(menuItemsAt(items, 'bottom').map((i) => i.key)).toEqual(['d', 'b'])

  const { skipped } = checkManifest(addon, {
    contributes: [
      { slot: 'entityMenuItem', id: 'ok', label: 'A', icon: 'link', run: loader, position: 'top' },
      { slot: 'entityMenuItem', id: 'bad', label: 'B', icon: 'link', run: loader, position: 'first' },
    ],
  })
  expect(skipped.map((s) => [s.id, s.reason])).toEqual([['bad', 'invalid position "first"']])
})

test('header and toolbar items have exactly one action and an icon unless they draw themselves', () => {
  const header = { slot: 'header.item', label: 'Comments', placement: 'left' }
  const { contributions, skipped } = checkManifest(addon, {
    contributes: [
      { ...header, id: 'goes', icon: 'chat', to: '/dashboard/comments' },
      { ...header, id: 'opens', icon: 'chat', dialog: loader },
      { ...header, id: 'own', component: loader },
      { ...header, id: 'none', icon: 'chat' },
      { ...header, id: 'two', icon: 'chat', run: loader, menu: loader },
      { ...header, id: 'noIcon', run: loader },
      { ...header, id: 'relative', icon: 'chat', to: 'dashboard' },
      { slot: 'projectTable.toolbarItem', id: 'menu', icon: 'more_vert', menu: loader },
    ],
  })
  expect(contributions.map((c) => c.id)).toEqual(['goes', 'opens', 'own', 'menu'])
  expect(skipped.map((s) => [s.id, s.reason])).toEqual([
    ['none', 'set exactly one of to, run, dialog, menu, component (it has none)'],
    ['two', 'set exactly one of to, run, dialog, menu, component (it has run, menu)'],
    ['noIcon', 'missing icon'],
    ['relative', 'invalid to "dashboard"'],
  ])
})

test("table shortcuts have one action and keys that parse and aren't the table's own", () => {
  const shortcut = { slot: 'table.shortcut', label: 'Copy row', run: loader }
  const { contributions, skipped } = checkManifest(addon, {
    contributes: [
      { ...shortcut, id: 'plain', keys: 'g' },
      { ...shortcut, id: 'combo', keys: 'shift+mod+c' },
      { slot: 'table.shortcut', id: 'opens', label: 'Open', keys: 'alt+1', dialog: loader },
      { slot: 'table.shortcut', id: 'none', label: 'Nothing', keys: 'h' },
      { ...shortcut, id: 'garbled', keys: 'shift+hyper+c' },
      { ...shortcut, id: 'copy', keys: 'mod+c' },
      { ...shortcut, id: 'redo', keys: 'shift+mod+z' },
      { ...shortcut, id: 'rename', keys: 'r' },
      { ...shortcut, id: 'arrow', keys: 'shift+down' },
    ],
  })
  expect(contributions.map((c) => c.id)).toEqual(['plain', 'combo', 'opens'])
  expect(skipped.map((s) => [s.id, s.reason])).toEqual([
    ['none', 'set exactly one of run, dialog (it has none)'],
    ['garbled', 'keys "shift+hyper+c" is not a key combination, e.g. "g" or "shift+mod+c"'],
    ['copy', `keys "mod+c" is one of AYON's own table keys`],
    ['redo', `keys "shift+mod+z" is one of AYON's own table keys`],
    ['rename', `keys "r" is one of AYON's own table keys`],
    ['arrow', `keys "shift+down" is one of AYON's own table keys`],
  ])

  // Node has no navigator, so `mod` is Ctrl; letters match by place, whatever Shift or Alt types
  const key = {
    key: 'C',
    code: 'KeyC',
    ctrlKey: true,
    metaKey: false,
    altKey: false,
    shiftKey: true,
  }
  expect(matchesShortcut(key, parseShortcut('shift+mod+c')!)).toBe(true)
  expect(matchesShortcut(key, parseShortcut('mod+c')!)).toBe(false)
  expect(
    matchesShortcut(
      { ...key, key: '©', ctrlKey: false, shiftKey: false, altKey: true },
      parseShortcut('alt+c')!,
    ),
  ).toBe(true)
  expect(
    matchesShortcut(
      { ...key, key: 'F2', code: 'F2', ctrlKey: false, shiftKey: false },
      parseShortcut('f2')!,
    ),
  ).toBe(true)
})

test('a details panel item is pinned with true or false', () => {
  const item = { slot: 'detailsPanel.menuItem', label: 'Copy link', icon: 'add_link', run: loader }
  const { contributions, skipped } = checkManifest(addon, {
    contributes: [
      { ...item, id: 'pinned', pinned: true },
      { ...item, id: 'yes', pinned: 'yes' },
    ],
  })
  expect(contributions.map((c) => c.id)).toEqual(['pinned'])
  expect(skipped.map((s) => [s.id, s.reason])).toEqual([['yes', 'pinned must be true or false']])
})

test('a table column sits in a named submenu or at the top level', () => {
  const column = { slot: 'tableColumn', label: 'Due in', cell: loader }
  const { contributions, skipped } = checkManifest(addon, {
    contributes: [
      { ...column, id: 'own' },
      { ...column, id: 'named', menu: 'Production' },
      { ...column, id: 'top', menu: false },
      { ...column, id: 'blank', menu: ' ' },
      { ...column, id: 'yes', menu: true },
    ],
  })
  expect(contributions.map((c) => c.id)).toEqual(['own', 'named', 'top'])
  expect(skipped.map((s) => [s.id, s.reason])).toEqual([
    ['blank', 'menu must be a name or false'],
    ['yes', 'menu must be a name or false'],
  ])
})

test('a table column lists tag types or { type, id } tags, and has values to refresh', () => {
  const column = { slot: 'tableColumn', label: 'Time logged', cell: loader, fetchValues: loader }
  const { contributions, skipped } = checkManifest(addon, {
    contributes: [
      { ...column, id: 'types', providesTags: ['myaddonLog', 'task'] },
      {
        ...column,
        id: 'ids',
        providesTags: [
          { type: 'myaddonLog', id: 'LIST' },
          { type: 'task', id: 1 },
        ],
      },
      { ...column, id: 'one', providesTags: 'myaddonLog' },
      { ...column, id: 'blank', providesTags: [''] },
      { ...column, id: 'noType', providesTags: [{ id: 'LIST' }] },
      { ...column, id: 'noValues', fetchValues: undefined, providesTags: ['myaddonLog'] },
    ],
  })
  expect(contributions.map((c) => c.id)).toEqual(['types', 'ids'])
  const badTags = "providesTags must be a list of tag types or { type, id } tags, e.g. ['myaddonItem']"
  expect(skipped.map((s) => [s.id, s.reason])).toEqual([
    ['one', badTags],
    ['blank', badTags],
    ['noType', badTags],
    ['noValues', 'providesTags needs fetchValues: the tags refresh its values'],
  ])
})

test('a manifest without a contributes list is reported', () => {
  const { contributions, skipped } = checkManifest(addon, { default: {} }, slots)
  expect(contributions).toEqual([])
  expect(skipped[0].reason).toContain('no "contributes" list')
})

const renderInSlot = (slot: string | null, asked: string | string[]) => {
  const Probe = () => {
    useSlot(asked as never)
    return null
  }
  const contribution = { slot: slot || '', id: 'tab', key: 'my-addon.tab', addon }
  const element = slot
    ? createElement(
        SlotReactContext.Provider,
        { value: { slot, value: { slot }, contribution } },
        createElement(Probe),
      )
    : createElement(Probe)
  return () => renderToString(element)
}

test('useSlot in another slot throws an error naming both slots', () => {
  expect(renderInSlot('detailsPanel.tab', 'project.page')).toThrow(
    "useSlot('project.page') was called in a component rendered in slot 'detailsPanel.tab' (my-addon.tab)",
  )
  expect(renderInSlot('detailsPanel.tab', ['project.page', 'studio.page'])).toThrow(
    "useSlot(['project.page', 'studio.page']) was called in a component rendered in slot 'detailsPanel.tab'",
  )
  expect(renderInSlot(null, 'project.page')).toThrow(
    "useSlot('project.page') was called outside any addon slot",
  )
  expect(renderInSlot('project.page', ['project.page', 'studio.page'])).not.toThrow()
})

// agents read the shipped AGENTS.md: it must match SlotMap
test('addon/AGENTS.md is generated from the current SlotMap', () => {
  const result = spawnSync(process.execPath, ['addon/scripts/generate-docs.mjs', '--check'], {
    cwd: path.join(__dirname, '../..'),
    encoding: 'utf8',
  })
  expect(`${result.stdout}${result.stderr}`).toContain('up to date')
  expect(result.status).toBe(0)
})
