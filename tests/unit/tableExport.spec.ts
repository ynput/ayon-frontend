import { expect, test } from '@playwright/test'
import {
  DEFAULT_TABLE_EXPORT_SETTINGS,
  IMPORTABLE_SETTINGS,
  getExportErrorMessage,
  getExportFileName,
  getImportableSettings,
  isImportable,
  type TableExportSettings,
} from '../../shared/src/containers/TableExport/tableExportSettings'
import { resolveColumnVisibility } from '../../shared/src/containers/ProjectTreeTable/utils/checkColumnVisibility'
import { buildSortArgs, getForwardSortBy } from '../../shared/src/util/sortingHelpers'

const settings = (overrides: Partial<TableExportSettings> = {}): TableExportSettings => ({
  ...DEFAULT_TABLE_EXPORT_SETTINGS,
  ...overrides,
})

test.describe('table export settings', () => {
  test('the defaults are not importable, the import settings are', () => {
    expect(isImportable(settings())).toBe(false)
    expect(isImportable(settings(IMPORTABLE_SETTINGS))).toBe(true)
  })

  test('readable values or Excel are not importable', () => {
    expect(isImportable(settings({ ...IMPORTABLE_SETTINGS, content: 'readable' }))).toBe(false)
    expect(isImportable(settings({ ...IMPORTABLE_SETTINGS, format: 'xlsx' }))).toBe(false)
    expect(isImportable(settings({ ...IMPORTABLE_SETTINGS, includeImportColumns: false }))).toBe(
      false,
    )
  })

  // Import CSV uploads only .csv files (text/csv), a tab separated file is a .tsv
  test('import settings with a tab delimiter are not importable', () => {
    expect(isImportable(settings({ ...IMPORTABLE_SETTINGS, delimiter: '\t' }))).toBe(false)
    expect(isImportable(settings({ ...IMPORTABLE_SETTINGS, delimiter: ';' }))).toBe(true)
  })

  test('use import settings', () => {
    const tab = getImportableSettings(settings({ delimiter: '\t', selectionColumns: 'visible' }))
    expect(isImportable(tab)).toBe(true)
    expect(tab.delimiter).toBe(',')
    expect(tab.selectionColumns).toBe('visible')
    expect(getImportableSettings(settings({ delimiter: ';' })).delimiter).toBe(';')
  })

  test('file name', () => {
    const date = new Date().toLocaleDateString('sv')
    expect(getExportFileName('proj', 'table', settings())).toBe(`proj-table-${date}.xlsx`)
    expect(getExportFileName('proj', 'selection', settings({ format: 'csv' }))).toBe(
      `proj-selection-${date}.csv`,
    )
    expect(getExportFileName('proj', 'table', settings({ format: 'csv', delimiter: ';' }))).toBe(
      `proj-table-${date}.csv`,
    )
    expect(getExportFileName('proj', 'table', settings({ format: 'csv', delimiter: '\t' }))).toBe(
      `proj-table-${date}.tsv`,
    )
  })
})

test.describe('forward sortBy', () => {
  const forward = (keys: { key: string; desc?: boolean }[]) => getForwardSortBy(buildSortArgs(keys))

  test('no sorting', () => {
    expect(getForwardSortBy({ sortBy: undefined, desc: false })).toBeUndefined()
  })

  test('every key carries its own direction', () => {
    expect(forward([{ key: 'name' }])).toEqual(['name'])
    expect(forward([{ key: 'name', desc: true }])).toEqual(['-name'])
    expect(forward([{ key: 'status' }, { key: 'name', desc: true }])).toEqual(['status', '-name'])
    expect(forward([{ key: 'status', desc: true }, { key: 'name' }])).toEqual(['-status', 'name'])
    expect(
      forward([
        { key: 'status', desc: true },
        { key: 'name', desc: true },
      ]),
    ).toEqual(['-status', '-name'])
  })
})

test.describe('export error message', () => {
  test('the server detail', () => {
    expect(getExportErrorMessage(404, 'Not Found', { detail: 'Project x not found' })).toBe(
      'Project x not found',
    )
  })

  test('request validation errors', () => {
    const data = {
      detail: 'Request validation error in [POST] /api/export-table',
      errors: [{ loc: ['body', 'format'], msg: "Input should be 'csv' or 'xlsx'" }],
    }
    expect(getExportErrorMessage(400, 'Bad Request', data)).toBe(
      "Request validation error in [POST] /api/export-table: Input should be 'csv' or 'xlsx'",
    )
  })

  test('no JSON body', () => {
    expect(getExportErrorMessage(502, 'Bad Gateway', undefined)).toBe('502 Bad Gateway')
    expect(getExportErrorMessage(500, '', {})).toBe('500')
  })
})

test.describe('resolved column visibility', () => {
  test('a saved setting of a longer column id does not hide or show another', () => {
    const visibility = resolveColumnVisibility(
      { attrib_frameStart: true },
      ['name', 'attrib_frame', 'attrib_frameStart'],
      { name: true, attrib_frame: false },
    )
    expect(visibility).toMatchObject({ name: true, attrib_frame: false, attrib_frameStart: true })
  })

  test('saved settings, then the column flag, then defaults', () => {
    const visibility = resolveColumnVisibility(
      { name: false },
      ['name', 'status', 'tags'],
      { name: true, status: true, tags: true },
      { tags: false },
    )
    expect(visibility).toMatchObject({ name: false, status: true, tags: false })
  })

  test('the name column when nothing is visible', () => {
    const visibility = resolveColumnVisibility({ status: false }, ['name', 'status'], {})
    expect(visibility).toMatchObject({ name: true, status: false })
  })
})
