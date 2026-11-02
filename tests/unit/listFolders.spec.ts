import { expect, test } from '@playwright/test'
import {
  buildListFolderOptions,
  getNewListFolderId,
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
