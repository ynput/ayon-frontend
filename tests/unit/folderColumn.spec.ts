import { expect, test } from '@playwright/test'
import {
  getFolderColumnEntity,
  getFolderColumnValue,
} from '../../shared/src/containers/ProjectTreeTable/utils/folderColumn'
import {
  buildFolderTableRow,
  buildTaskTableRow,
} from '../../shared/src/containers/ProjectTreeTable/utils/tableRowBuilders'
import type {
  EditorTaskNode,
  MatchingFolder,
  TableRow,
} from '../../shared/src/containers/ProjectTreeTable/types/table'

const folder = {
  id: 'f1',
  name: 'sh010',
  label: 'Shot 010',
  folderType: 'Shot',
  entityType: 'folder',
} as MatchingFolder

const folderRow = buildFolderTableRow(folder)
const taskRow = buildTaskTableRow(
  { id: 't1', name: 'anim', taskType: 'Animation', folderId: 'f1' } as EditorTaskNode,
  folder,
)

test('a folder row of the flat folder view shows itself', () => {
  expect(getFolderColumnEntity(folderRow, true)).toBe(folderRow.primary)
  expect(getFolderColumnValue(folderRow, true)).toBe('Shot 010')
})

test('a folder row shows the same folder as its task rows', () => {
  expect(getFolderColumnEntity(folderRow, true)?.id).toBe(getFolderColumnEntity(taskRow, true)?.id)
  expect(getFolderColumnValue(folderRow, true)).toBe(getFolderColumnValue(taskRow, true))
})

test('the folder name is used when the folder has no label', () => {
  const unlabelled = buildFolderTableRow({ ...folder, label: undefined } as MatchingFolder)
  expect(getFolderColumnValue(unlabelled, true)).toBe('sh010')
})

test('a folder row stays empty outside the flat folder view', () => {
  expect(getFolderColumnEntity(folderRow)).toBeUndefined()
  expect(getFolderColumnValue(folderRow, false)).toBeUndefined()
})

test('a task row shows its parent folder in every view', () => {
  for (const isFlatFolderView of [true, false]) {
    expect(getFolderColumnEntity(taskRow, isFlatFolderView)?.id).toBe('f1')
    expect(getFolderColumnValue(taskRow, isFlatFolderView)).toBe('Shot 010')
  }
})

test('a task row without a known folder stays empty', () => {
  const orphan = buildTaskTableRow({ id: 't2', name: 'comp', folderId: 'f9' } as EditorTaskNode)
  expect(getFolderColumnEntity(orphan, true)).toBeUndefined()
})

test('group and meta rows stay empty', () => {
  const groupRow: TableRow = { ...folderRow, group: { value: 'a', label: 'A' } }
  const emptyRow: TableRow = { ...folderRow, metaType: 'empty' }
  for (const row of [groupRow, emptyRow]) {
    expect(getFolderColumnEntity(row, true)).toBeUndefined()
    expect(getFolderColumnValue(row, true)).toBeUndefined()
  }
})
