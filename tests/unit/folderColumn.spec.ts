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

test('a folder row shows itself', () => {
  expect(getFolderColumnEntity(folderRow)).toBe(folderRow.primary)
  expect(getFolderColumnValue(folderRow)).toBe('Shot 010')
})

test('a folder row shows the same folder as its task rows', () => {
  expect(getFolderColumnEntity(folderRow)?.id).toBe(getFolderColumnEntity(taskRow)?.id)
  expect(getFolderColumnValue(folderRow)).toBe(getFolderColumnValue(taskRow))
})

test('in the hierarchy a nested folder row shows itself, not its parent folder', () => {
  const sequence = { ...folder, id: 'f0', name: 'sq01', label: 'Sequence 01' } as MatchingFolder
  const shot = { ...folder, parentId: 'f0', parents: ['sq01'] } as MatchingFolder
  const sequenceRow: TableRow = {
    ...buildFolderTableRow(sequence),
    subRows: [{ ...buildFolderTableRow(shot), subRows: [taskRow] }],
  }
  const shotRow = sequenceRow.subRows![0]

  expect(getFolderColumnValue(sequenceRow)).toBe('Sequence 01')
  expect(getFolderColumnEntity(shotRow)).toBe(shotRow.primary)
  expect(getFolderColumnValue(shotRow)).toBe('Shot 010')
  expect(getFolderColumnValue(shotRow.subRows![0])).toBe('Shot 010')
})

test('the folder name is used when the folder has no label', () => {
  const unlabelled = buildFolderTableRow({ ...folder, label: undefined } as MatchingFolder)
  expect(getFolderColumnValue(unlabelled)).toBe('sh010')
})

test('a task row shows its parent folder', () => {
  expect(getFolderColumnEntity(taskRow)?.id).toBe('f1')
  expect(getFolderColumnValue(taskRow)).toBe('Shot 010')
})

test('a task row without a known folder stays empty', () => {
  const orphan = buildTaskTableRow({ id: 't2', name: 'comp', folderId: 'f9' } as EditorTaskNode)
  expect(getFolderColumnEntity(orphan)).toBeUndefined()
})

test('group, meta and loading rows stay empty', () => {
  const groupRow: TableRow = { ...folderRow, group: { value: 'a', label: 'A' } }
  const emptyRow: TableRow = { ...folderRow, metaType: 'empty' }
  const loadingRow: TableRow = { ...folderRow, isLoading: true }
  for (const row of [groupRow, emptyRow, loadingRow]) {
    expect(getFolderColumnEntity(row)).toBeUndefined()
    expect(getFolderColumnValue(row)).toBeUndefined()
  }
})
