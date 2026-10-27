import { expect, test } from '@playwright/test'
import { spawnSync } from 'child_process'
import path from 'path'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { checkManifest, formatSkipped } from '../../addon/src/validate'
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
