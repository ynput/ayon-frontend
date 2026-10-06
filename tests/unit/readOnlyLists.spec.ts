import { expect, test } from '@playwright/test'
import { getReadOnlyLists } from '../../shared/src/containers/ProjectTreeTable/utils/getReadOnlyLists'

type Attribute = Parameters<typeof getReadOnlyLists>[0][number]

const attrib = (name: string, { builtin = true, readOnly = false } = {}) =>
  ({ name, builtin, readOnly, scope: ['folder', 'task'], data: { type: 'string' } } as Attribute)

// the built-in (non attribute) fields, in the ids the table uses for their columns
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

test('nothing is read-only without restrictions', () => {
  expect(
    getReadOnlyLists([attrib('fps'), attrib('custom', { builtin: false })], undefined),
  ).toEqual({ readOnlyColumns: [], readOnlyAttribs: [] })
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
  expect(sorted(lists.readOnlyColumns)).toEqual(['attrib_custom', 'attrib_fps'])
  expect(sorted(lists.readOnlyAttribs)).toEqual(['custom', 'fps'])
})

test('built-in fields missing from the writable fields are read-only', () => {
  const lists = getReadOnlyLists([], ['name', 'status'])
  const locked = BUILT_IN_FIELDS.filter((field) => !['name', 'status'].includes(field))
  // subType is the combined folder/task type column
  expect(sorted(lists.readOnlyColumns)).toEqual(sorted([...locked, 'subType']))
  // the field ids are also reported with the attributes (used by clipboard paste)
  expect(sorted(lists.readOnlyAttribs)).toEqual(sorted([...locked, 'subType']))
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
    'attrib_fps',
    'attrib_unknown',
  ])
  expect(sorted(lists.readOnlyColumns)).toEqual(['attrib_fps', 'attrib_unknown', 'status'])
  expect(lists.readOnlyAttribs).toEqual(['fps'])
})

test("'attrib' in the extra columns locks every built-in attribute", () => {
  const lists = getReadOnlyLists(
    [attrib('fps'), attrib('frameStart'), attrib('custom', { builtin: false })],
    undefined,
    ['attrib'],
  )
  expect(sorted(lists.readOnlyColumns)).toEqual(['attrib', 'attrib_fps', 'attrib_frameStart'])
  expect(sorted(lists.readOnlyAttribs)).toEqual(['fps', 'frameStart'])
})

// FLAG: with 'attrib' in the extra read-only columns (lists of products and versions,
// getColumnConfigFromType) the list of read-only attributes is replaced by the built-in ones, so a
// custom attribute the access group may not write loses its header lock and clipboard paste
// into it is allowed (the server then rejects the update). getReadOnlyLists.ts:48-55.
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

// FLAG: an access group with "Restrict attribute update" on and no field switched on sends
// `fields: []`; `writableFields?.length` treats that as unrestricted. Fixed in
// ynput/ayon-frontend#2404, switch to `test` once it is merged.
test.fixme('an empty writable fields list makes every built-in field read-only', () => {
  const lists = getReadOnlyLists([], [])
  expect(sorted(lists.readOnlyColumns)).toEqual(sorted([...BUILT_IN_FIELDS, 'subType']))
})
