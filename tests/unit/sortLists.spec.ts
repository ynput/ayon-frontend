import { expect, test } from '@playwright/test'
import {
  DEFAULT_LISTS_SORT,
  resolveListsSort,
  sortLists,
} from '../../src/pages/ProjectListsPage/util/sortLists'

const list = (label: string, day: number, { active = true, updated = day } = {}) => ({
  label,
  active,
  createdAt: `2026-01-${String(day).padStart(2, '0')}T00:00:00Z`,
  updatedAt: `2026-02-${String(updated).padStart(2, '0')}T00:00:00Z`,
})

const LISTS = [
  list('banana', 1, { updated: 9 }),
  list('Cherry', 3, { updated: 1 }),
  list('apple', 2, { updated: 5 }),
  list('Archived', 4, { active: false }),
]

const labels = (lists: { label: string }[]) => lists.map((l) => l.label)

test('lists are sorted newest first by default', () => {
  expect(labels(sortLists(LISTS))).toEqual(['Cherry', 'apple', 'banana', 'Archived'])
})

test('lists are sorted by name, ignoring case', () => {
  expect(labels(sortLists(LISTS, { by: 'label', desc: false }))).toEqual([
    'apple',
    'banana',
    'Cherry',
    'Archived',
  ])
  expect(labels(sortLists(LISTS, { by: 'label', desc: true }))).toEqual([
    'Cherry',
    'banana',
    'apple',
    'Archived',
  ])
})

test('numbers in names are sorted by value', () => {
  const lists = [list('shot 10', 1), list('shot 2', 2), list('Shot 1', 3)]
  expect(labels(sortLists(lists, { by: 'label', desc: false }))).toEqual([
    'Shot 1',
    'shot 2',
    'shot 10',
  ])
})

test('lists are sorted by updated date', () => {
  expect(labels(sortLists(LISTS, { by: 'updatedAt', desc: true }))).toEqual([
    'banana',
    'apple',
    'Cherry',
    'Archived',
  ])
})

test('lists with the same name keep the newest first', () => {
  const lists = [
    { ...list('dailies', 1), id: 'old' },
    { ...list('Dailies', 2), id: 'new' },
  ]
  for (const desc of [false, true]) {
    expect(sortLists(lists, { by: 'label', desc }).map((l) => l.id)).toEqual(['new', 'old'])
  }
})

test('an unknown saved sort falls back to the default', () => {
  expect(resolveListsSort(undefined)).toEqual(DEFAULT_LISTS_SORT)
  expect(resolveListsSort({ by: 'owner', desc: false })).toEqual(DEFAULT_LISTS_SORT)
  expect(resolveListsSort({ by: 'label' })).toEqual({ by: 'label', desc: false })
})
