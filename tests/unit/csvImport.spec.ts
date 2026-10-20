import { expect, test } from '@playwright/test'
import {
  detectDateOrder,
  isIsoDate,
  parseDate,
} from '../../src/containers/ImportDialog/steps/ReviewValuesStep/dates'
import { inferMapping } from '../../src/containers/ImportDialog/steps/MapColumnsStep/inferMapping'
import {
  describeImportMode,
  getRequiredTargetGroups,
  getUnmappedRequiredTargetGroups,
  ImportMode,
  schemaForListValues,
  schemaForRowsEntityType,
} from '../../src/containers/ImportDialog/steps/importMode'
import { ColumnAction, ImportSchema } from '../../src/containers/ImportDialog/steps/common'

const column = (key: string, label: string, required = false) => ({
  key,
  label,
  required,
  valueType: 'string' as const,
  errorHandlingModes: ['skip' as const],
})

const hierarchySchema: ImportSchema = [
  column('name', 'Name'),
  column('path', 'Path', true),
  column('entity_type', 'Entity type', true),
  column('folder_type', 'Folder type'),
  column('task_type', 'Task type'),
  column('folder_or_task_type', 'Folder or Task type'),
  column('attrib.priority', 'Priority'),
  column('attrib.startDate', 'Start date'),
]

const mapped = (...targets: string[]) =>
  Object.fromEntries(
    targets.map((target) => [target, { action: ColumnAction.MAP, targetColumn: target }]),
  )

test.describe('csv import dates', () => {
  test('plain dates in common formats become ISO dates', () => {
    expect(parseDate('20.10.2026', 'dmy')).toBe('2026-10-20')
    expect(parseDate('10/10/2026', 'dmy')).toBe('2026-10-10')
    expect(parseDate('10-1-2026', 'dmy')).toBe('2026-01-10')
    expect(parseDate('10.1.26', 'dmy')).toBe('2026-01-10')
    expect(parseDate('2026/1/10', 'dmy')).toBe('2026-01-10')
    expect(parseDate('Jan 5 2026', 'dmy')).toBe('2026-01-05')
    expect(parseDate('2026-10-20', 'dmy')).toBe('2026-10-20')
  })

  test('the order decides between day and month', () => {
    expect(parseDate('10/1/2026', 'dmy')).toBe('2026-01-10')
    expect(parseDate('10/1/2026', 'mdy')).toBe('2026-10-01')
    expect(parseDate('1/13/2026', 'dmy')).toBeNull()
  })

  test('impossible or incomplete dates are rejected', () => {
    expect(parseDate('31.2.2026', 'dmy')).toBeNull()
    expect(parseDate('10.1', 'dmy')).toBeNull()
    expect(parseDate('soon', 'dmy')).toBeNull()
  })

  test('midnight is a plain date, other times keep the local time with its offset', () => {
    expect(parseDate('2026-10-20T00:00:00', 'dmy')).toBe('2026-10-20')
    expect(parseDate('20.10.2026 00:00', 'dmy')).toBe('2026-10-20')

    const withTime = parseDate('10.1.2026 14:30', 'dmy')!
    expect(withTime).toMatch(/^2026-01-10T14:30:00[+-]\d{2}:\d{2}$/)
    expect(new Date(withTime).getHours()).toBe(14)
    expect(isIsoDate(withTime)).toBe(true)

    expect(parseDate('2026-10-20T00:00:00+00:00', 'dmy')).toBe('2026-10-20T00:00:00+00:00')
  })

  test('a column settles its day/month order from a value only one order can read', () => {
    expect(detectDateOrder(['13.2.2026', '10/12/2026'])).toMatchObject({
      order: 'dmy',
      ambiguous: false,
    })
    expect(detectDateOrder(['1/13/2026', '10/1/2026'])).toMatchObject({
      order: 'mdy',
      ambiguous: false,
    })
    expect(detectDateOrder(['10.1.2026', '20.1.2026'])).toMatchObject({ order: 'dmy' })
    expect(detectDateOrder(['10.1.2026', '10/10/2026']).ambiguous).toBe(true)
    expect(detectDateOrder(['2026-01-10']).hasDayMonthValues).toBe(false)
  })
})

test.describe('csv import column mapping', () => {
  test('project table column ids map to their targets', () => {
    expect(inferMapping('attrib_priority', hierarchySchema)?.targetColumn).toBe('attrib.priority')
    expect(inferMapping('Start date', hierarchySchema)?.targetColumn).toBe('attrib.startDate')
    expect(inferMapping('path*', hierarchySchema)?.targetColumn).toBe('path')
  })

  test('subType maps to the folder or task type the schema offers', () => {
    expect(inferMapping('subType', hierarchySchema)?.targetColumn).toBe('folder_or_task_type')
    expect(
      inferMapping('subType', schemaForRowsEntityType(hierarchySchema, 'folder'))?.targetColumn,
    ).toBe('folder_type')
    expect(
      inferMapping('subType', schemaForRowsEntityType(hierarchySchema, 'task'))?.targetColumn,
    ).toBe('task_type')
  })
})

test.describe('csv import required targets', () => {
  test('creating folders and tasks needs a path and an entity type', () => {
    expect(
      getRequiredTargetGroups('hierarchy', ImportMode.CREATE_AND_UPDATE, hierarchySchema),
    ).toEqual([['path'], ['entity_type']])
  })

  test('a fixed entity type drops the entity type requirement', () => {
    const folders = schemaForRowsEntityType(hierarchySchema, 'folder')
    expect(folders.map(({ key }) => key)).not.toContain('entity_type')
    expect(getRequiredTargetGroups('hierarchy', ImportMode.CREATE_AND_UPDATE, folders)).toEqual([
      ['path'],
    ])
  })

  test('updating only needs a path or a name', () => {
    expect(
      getUnmappedRequiredTargetGroups(
        'hierarchy',
        ImportMode.UPDATE_ONLY,
        hierarchySchema,
        mapped('name'),
      ),
    ).toEqual([])
    expect(
      getUnmappedRequiredTargetGroups('hierarchy', ImportMode.UPDATE_ONLY, hierarchySchema, {}),
    ).toEqual([['path', 'name']])
  })

  test('a combined folder or task type needs the entity type even when updating', () => {
    expect(
      getRequiredTargetGroups(
        'hierarchy',
        ImportMode.UPDATE_ONLY,
        hierarchySchema,
        mapped('name', 'folder_or_task_type'),
      ),
    ).toEqual([['path', 'name'], ['entity_type']])
  })

  test('list items need an entity by path, name or id, never a list id column', () => {
    expect(getRequiredTargetGroups('entity_list_item', ImportMode.UPDATE_ONLY, [], {})).toEqual([
      ['folder_path', 'name', 'entity_id'],
    ])
    expect(
      getRequiredTargetGroups('entity_list_item', ImportMode.CREATE_AND_UPDATE, [], {}),
    ).toEqual([['folder_path', 'name', 'entity_id']])
  })
})

test.describe('csv import into a list', () => {
  const listSchema: ImportSchema = [
    column('name', 'Entity name'),
    column('status', 'Status'),
    column('tags', 'Tags'),
    column('attrib.priority', 'Priority'),
    column('attrib.cutOrder', 'Cut order'),
  ]

  test('list values (powerpack) offer only attributes, entity updates offer everything', () => {
    const keys = (schema: ImportSchema) => schema.map(({ key }) => key)
    expect(keys(schemaForListValues(listSchema, false))).toEqual([
      'name',
      'attrib.priority',
      'attrib.cutOrder',
    ])
    expect(keys(schemaForListValues(listSchema, true))).toEqual(keys(listSchema))
  })

  test('the mode description says where the values go', () => {
    expect(describeImportMode('entity_list_item', ImportMode.UPDATE_ONLY, true)).toContain(
      'on the entities',
    )
    expect(describeImportMode('entity_list_item', ImportMode.CREATE_AND_UPDATE)).toContain(
      'on the list items',
    )
  })
})
