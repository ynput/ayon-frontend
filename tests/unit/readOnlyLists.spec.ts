import { expect, test } from '@playwright/test'
import { getReadOnlyLists } from '../../shared/src/containers/ProjectTreeTable/utils/getReadOnlyLists'
import validateUpdateEntities from '../../shared/src/containers/ProjectTreeTable/utils/validateUpdateEntities'

type Attribute = Parameters<typeof getReadOnlyLists>[0][number]

const attrib = (name: string, { builtin = true, readOnly = false } = {}) =>
  ({ name, builtin, readOnly, scope: ['folder', 'task'], data: { type: 'string' } } as Attribute)

const BUILT_IN_FIELDS = [
  'name',
  'label',
  'status',
  'tags',
  'assignees',
  'active',
  'parentId',
  'folderType',
  'taskType',
  'productType',
  'author',
]

const sorted = (values: string[]) => [...values].sort()

// set by the server, never writable from a table
const SYSTEM_COLUMNS = ['createdAt', 'createdBy', 'updatedAt', 'updatedBy']
// list membership columns, always read-only for paste
const LIST_COLUMNS = ['lists', 'reviewSessions']

test('nothing is read-only without restrictions, except the system and list columns', () => {
  const lists = getReadOnlyLists([attrib('fps'), attrib('custom', { builtin: false })], undefined)
  expect(sorted(lists.readOnlyColumns)).toEqual(sorted(SYSTEM_COLUMNS))
  expect(sorted(lists.readOnlyAttribs)).toEqual(sorted([...LIST_COLUMNS, ...SYSTEM_COLUMNS]))
})

test('attributes the user may not write are read-only', () => {
  const lists = getReadOnlyLists(
    [
      attrib('fps', { readOnly: true }),
      attrib('resolutionWidth'),
      attrib('custom', { builtin: false, readOnly: true }),
    ],
    undefined,
  )
  expect(sorted(lists.readOnlyColumns)).toEqual(
    sorted(['attrib_custom', 'attrib_fps', ...SYSTEM_COLUMNS]),
  )
  expect(sorted(lists.readOnlyAttribs)).toEqual(
    sorted(['custom', 'fps', ...LIST_COLUMNS, ...SYSTEM_COLUMNS]),
  )
})

test('built-in fields missing from the writable fields are read-only', () => {
  const lists = getReadOnlyLists([], ['name', 'status'])
  const locked = BUILT_IN_FIELDS.filter((field) => !['name', 'status'].includes(field))
  expect(sorted(lists.readOnlyColumns)).toEqual(sorted([...locked, 'subType', ...SYSTEM_COLUMNS]))
  expect(sorted(lists.readOnlyAttribs)).toEqual(
    sorted([...locked, 'subType', ...LIST_COLUMNS, ...SYSTEM_COLUMNS]),
  )
})

test('dates and creators are read-only even when the server lists them as writable', () => {
  const lists = getReadOnlyLists([], ['name', 'createdAt', 'updatedBy'])
  for (const column of SYSTEM_COLUMNS) {
    expect(lists.readOnlyColumns, column).toContain(column)
    expect(lists.readOnlyAttribs, column).toContain(column)
  }
})

test('an update to a date or creator column is refused before it is sent', () => {
  for (const field of SYSTEM_COLUMNS) {
    expect(() =>
      validateUpdateEntities(
        [
          {
            rowId: 'row',
            id: 'entity',
            type: 'folder',
            field,
            value: '2026-11-02',
            isAttrib: false,
          },
        ],
        [],
      ),
    ).toThrow(`“${field}” is read-only`)
  }
})

test('writable fields can use snake_case names', () => {
  const lists = getReadOnlyLists([], ['parent_id', 'folder_type', 'task_type', 'product_type'])
  for (const field of ['parentId', 'folderType', 'taskType', 'productType', 'subType']) {
    expect(lists.readOnlyColumns, field).not.toContain(field)
  }
  expect(lists.readOnlyColumns).toContain('status')
})

test('the type column is only read-only when both folder and task types are', () => {
  expect(getReadOnlyLists([], ['folderType']).readOnlyColumns).not.toContain('subType')
  expect(getReadOnlyLists([], ['task_type']).readOnlyColumns).not.toContain('subType')
  expect(getReadOnlyLists([], ['status']).readOnlyColumns).toContain('subType')
})

test('extra read-only columns are added, and known attribute columns are reported as attributes', () => {
  const lists = getReadOnlyLists([attrib('fps')], undefined, [
    'status',
    'subtasks',
    'attrib_fps',
    'attrib_unknown',
  ])
  expect(sorted(lists.readOnlyColumns)).toEqual(
    sorted(['attrib_fps', 'attrib_unknown', 'status', 'subtasks', ...SYSTEM_COLUMNS]),
  )
  // paste checks this list, so the extra built-in columns refuse paste as well
  expect(sorted(lists.readOnlyAttribs)).toEqual(
    sorted(['fps', 'status', 'subtasks', ...LIST_COLUMNS, ...SYSTEM_COLUMNS]),
  )
})

test("'attrib' in the extra columns locks every built-in attribute", () => {
  const lists = getReadOnlyLists(
    [attrib('fps'), attrib('frameStart'), attrib('custom', { builtin: false })],
    undefined,
    ['attrib'],
  )
  expect(sorted(lists.readOnlyColumns)).toEqual(
    sorted(['attrib', 'attrib_fps', 'attrib_frameStart', ...SYSTEM_COLUMNS]),
  )
  expect(sorted(lists.readOnlyAttribs)).toEqual(
    sorted(['fps', 'frameStart', ...LIST_COLUMNS, ...SYSTEM_COLUMNS]),
  )
})

// FLAG: with 'attrib' in the extra read-only columns, read-only custom attributes lose their lock
// fixed in ynput/ayon-frontend#2411, switch back to test() once it is merged
test.fixme("a custom attribute the user may not write stays read-only with 'attrib' locked", () => {
  const lists = getReadOnlyLists(
    [attrib('fps'), attrib('custom', { builtin: false, readOnly: true })],
    undefined,
    ['attrib'],
  )
  expect(lists.readOnlyColumns).toContain('attrib_custom')
  expect(lists.readOnlyAttribs).toContain('custom')
})

// FLAG: `writableFields?.length` treats `fields: []` (nothing writable) as unrestricted
// fixed in ynput/ayon-frontend#2404, switch back to test() once it is merged
test.fixme('an empty writable fields list makes every built-in field read-only', () => {
  const lists = getReadOnlyLists([], [])
  expect(sorted(lists.readOnlyColumns)).toEqual(
    sorted([...BUILT_IN_FIELDS, 'subType', ...SYSTEM_COLUMNS]),
  )
})
