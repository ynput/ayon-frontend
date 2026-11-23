import { expect, test } from '@playwright/test'
import {
  buildListFolderOptions,
  getNewListFolderId,
  isFolderInScope,
} from '../../src/pages/ProjectListsPage/util/listFolders'

const FOLDERS = [
  { id: 'shots', label: 'Shots' },
  { id: 'comp', label: 'Comp', parentId: 'shots' },
  { id: 'assets', label: 'Assets', data: { icon: 'category' } },
  { id: 'reviews', label: 'Reviews', data: { scope: ['review-session'] } },
]

test('folder options show the path, sorted, for the list type', () => {
  expect(buildListFolderOptions(FOLDERS)).toEqual([
    { value: 'assets', label: 'Assets', icon: 'category' },
    { value: 'shots', label: 'Shots', icon: 'folder' },
    { value: 'comp', label: 'Shots / Comp', icon: 'folder' },
  ])
  expect(buildListFolderOptions(FOLDERS, true).map((o) => o.label)).toEqual([
    'Assets',
    'Reviews',
    'Shots',
    'Shots / Comp',
  ])
})

test('a new list starts in the selected folder, else in the selected list folder', () => {
  const inComp = { entityListFolderId: 'comp' }
  expect(getNewListFolderId(['shots'], [inComp])).toBe('shots')
  expect(getNewListFolderId([], [{}, inComp])).toBe('comp')
  expect(getNewListFolderId([], [])).toBeUndefined()
})

test('a table shows the folders of the list types it shows', () => {
  const [shots, , , reviews] = FOLDERS
  const genericOnly = { id: 'generic', label: 'Generic', data: { scope: ['generic'] } }
  expect(isFolderInScope(shots, ['generic'])).toBe(true)
  expect(isFolderInScope(shots, ['review-session'])).toBe(true)
  expect(isFolderInScope(genericOnly, ['generic'])).toBe(true)
  expect(isFolderInScope(genericOnly, ['review-session'])).toBe(false)
  expect(isFolderInScope(reviews, ['generic'])).toBe(false)
  expect(isFolderInScope(reviews, ['review-session'])).toBe(true)
  // both types, or none given: every folder
  for (const folder of [shots, genericOnly, reviews]) {
    expect(isFolderInScope(folder, ['generic', 'review-session'])).toBe(true)
    expect(isFolderInScope(folder)).toBe(true)
  }
})
