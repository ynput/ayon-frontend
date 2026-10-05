import { expect, test } from '@playwright/test'
import {
  convertColumnConfigToTanstackStates as loadView,
  convertTanstackStatesToColumnConfig as saveView,
} from '../../shared/src/util/columnConfigConverter'
import {
  ENTITY_COLUMN_IDS,
  normalizeColumnsConfig,
} from '../../shared/src/containers/ProjectTreeTable/utils/columnIds'
import {
  DRAG_HANDLE_COLUMN_ID,
  ROW_SELECTION_COLUMN_ID,
} from '../../shared/src/containers/ProjectTreeTable/constants'

type Settings = Parameters<typeof loadView>[0]
type States = Parameters<typeof saveView>[0]

const states = (overrides: Partial<States> = {}): States => ({
  columnVisibility: {},
  columnOrder: [],
  columnPinning: { left: [], right: [] },
  columnSizing: {},
  ...overrides,
})

const names = (settings: Settings) => (settings.columns || []).map((c) => c.name)

test.describe('loading a saved view', () => {
  test('restores order, visibility, pinning, widths and summaries', () => {
    const config = loadView({
      columns: [
        { name: 'name', visible: true, pinned: true, width: 300 },
        { name: 'status', visible: true },
        {
          name: 'attrib_fps',
          visible: false,
          summary: 'avg',
          summaryScope: 'primary',
          summaryFormat: 'percent',
        },
      ],
    } as Settings)

    expect(config.columnOrder).toEqual(['name', 'status', 'attrib_fps'])
    expect(config.columnVisibility).toEqual({ name: true, status: true, attrib_fps: false })
    expect(config.columnPinning).toEqual({ left: ['name'], right: [] })
    expect(config.columnSizing).toEqual({ name: 300 })
    expect(config.columnSummaries).toEqual({ attrib_fps: 'avg' })
    expect(config.columnSummaryScopes).toEqual({ attrib_fps: 'primary' })
    expect(config.columnSummaryFormats).toEqual({ attrib_fps: 'percent' })
  })

  test('a column saved without a visible flag is hidden', () => {
    expect(loadView({ columns: [{ name: 'tags' }] }).columnVisibility).toEqual({ tags: false })
  })

  test('an empty or missing view loads the defaults', () => {
    for (const settings of [{}, undefined as unknown as Settings]) {
      const config = loadView(settings)
      expect(config.columnOrder).toEqual([])
      expect(config.sorting).toEqual([])
      expect(config.groupBy).toBeUndefined()
      expect(config.groupByConfig).toEqual({ showEmpty: true, entityType: '' })
      expect(config.rowHeight).toBe(34)
    }
  })

  test('saved row selection and drag handle columns are ignored', () => {
    const config = loadView({
      columns: [
        { name: ROW_SELECTION_COLUMN_ID, visible: true, pinned: true },
        { name: 'name', visible: true },
        { name: DRAG_HANDLE_COLUMN_ID, visible: true, width: 24 },
      ],
    })
    expect(config.columnOrder).toEqual(['name'])
    expect(config.columnVisibility).toEqual({ name: true })
    expect(config.columnPinning.left).toEqual([])
    expect(config.columnSizing).toEqual({})
  })

  test('grouping loads from a string or the first non-empty entry of a list', () => {
    const groupings: [unknown, boolean | undefined, unknown][] = [
      ['status', undefined, { id: 'status', desc: false }],
      ['status', true, { id: 'status', desc: true }],
      [['', 'assignees', 'status'], false, { id: 'assignees', desc: false }],
      [[], undefined, undefined],
      [[''], undefined, undefined],
      ['', true, undefined],
      [undefined, undefined, undefined],
    ]
    for (const [groupBy, groupSortByDesc, expected] of groupings) {
      expect
        .soft(loadView({ groupBy, groupSortByDesc } as Settings).groupBy, JSON.stringify(groupBy))
        .toEqual(expected)
    }
  })

  test('sorting loads from sortBy, ascending unless sortDesc is set', () => {
    expect(loadView({ sortBy: 'name' }).sorting).toEqual([{ id: 'name', desc: false }])
    expect(loadView({ sortBy: 'name', sortDesc: true }).sorting).toEqual([
      { id: 'name', desc: true },
    ])
    expect(loadView({ sortDesc: true }).sorting).toEqual([])
  })
})

test.describe('saving a view', () => {
  test('keeps the column order and appends known columns without a position', () => {
    const settings = saveView(states({ columnOrder: ['status', 'name'] }), [
      'name',
      'thumbnail',
      'status',
      'tags',
    ])
    expect(names(settings)).toEqual(['status', 'name', 'thumbnail', 'tags'])
  })

  // ColumnSettingsProvider has to pass the order it displays; an empty order means "definition
  // order", which is how the first column change reordered the table (ynput/ayon-frontend#2399)
  test('an empty column order saves the columns in the order of allColumnIds', () => {
    const settings = saveView(states({ columnVisibility: { status: true } }), [
      'thumbnail',
      'name',
      'status',
    ])
    expect(names(settings)).toEqual(['thumbnail', 'name', 'status'])
  })

  test('keeps ordered columns the table does not know (yet)', () => {
    const settings = saveView(states({ columnOrder: ['attrib_removed', 'name'] }), ['name'])
    expect(names(settings)).toEqual(['attrib_removed', 'name'])
  })

  test('never saves the row selection and drag handle columns', () => {
    const settings = saveView(
      states({
        columnOrder: [DRAG_HANDLE_COLUMN_ID, ROW_SELECTION_COLUMN_ID, 'name'],
        columnVisibility: { [ROW_SELECTION_COLUMN_ID]: true, name: true },
        columnPinning: { left: [ROW_SELECTION_COLUMN_ID, 'name'], right: [] },
        columnSizing: { [DRAG_HANDLE_COLUMN_ID]: 24 },
      }),
      [DRAG_HANDLE_COLUMN_ID, ROW_SELECTION_COLUMN_ID, 'name', 'status'],
    )
    expect(names(settings)).toEqual(['name', 'status'])
  })

  test('each column carries its visibility, pinning, width and summary', () => {
    const settings = saveView(
      states({
        columnOrder: ['name', 'status', 'tags', 'attrib_fps'],
        columnVisibility: { name: true, status: false, attrib_fps: true },
        columnPinning: { left: ['name'], right: ['tags'] },
        columnSizing: { name: 250 },
        columnSummaries: { attrib_fps: 'sum' },
        columnSummaryScopes: { attrib_fps: 'secondary' },
        columnSummaryFormats: { attrib_fps: 'both' },
      }),
    )
    expect(settings.columns).toEqual([
      { name: 'name', visible: true, pinned: true, width: 250 },
      { name: 'status', visible: false },
      // no visibility state means hidden; right pinning is saved as the same boolean
      { name: 'tags', visible: false, pinned: true },
      {
        name: 'attrib_fps',
        visible: true,
        summary: 'sum',
        summaryScope: 'secondary',
        summaryFormat: 'both',
      },
    ])
  })

  test('grouping is saved as one field and cleared explicitly when removed', () => {
    const grouped = saveView(states({ groupBy: { id: 'status', desc: true } }))
    expect(grouped.groupBy).toBe('status')
    expect(grouped.groupSortByDesc).toBe(true)

    // the keys are present so that merging into the stored view removes the grouping
    const ungrouped = saveView(states({ groupBy: undefined }))
    expect(ungrouped).toHaveProperty('groupBy', undefined)
    expect(ungrouped).toHaveProperty('groupSortByDesc', undefined)
  })

  test('only the first sort is saved, an empty sort clears it and a missing one is left alone', () => {
    const sorted = saveView(
      states({
        sorting: [
          { id: 'name', desc: true },
          { id: 'status', desc: false },
        ],
      }),
    )
    expect(sorted).toMatchObject({ sortBy: 'name', sortDesc: true })

    const cleared = saveView(states({ sorting: [] }))
    expect(cleared).toHaveProperty('sortBy', undefined)
    expect(cleared).toHaveProperty('sortDesc', undefined)

    const untouched = saveView(states({ sorting: undefined }))
    expect(untouched).not.toHaveProperty('sortBy')
    expect(untouched).not.toHaveProperty('sortDesc')
  })

  test('empty group visibility and row height are only saved when set', () => {
    expect(saveView(states())).not.toHaveProperty('showEmptyGroups')
    expect(saveView(states())).not.toHaveProperty('rowHeight')
    const settings = saveView(states({ groupByConfig: { showEmpty: false }, rowHeight: 50 }))
    expect(settings).toMatchObject({ showEmptyGroups: false, rowHeight: 50 })
  })
})

test('a view survives a save and load round trip', () => {
  const original = states({
    columnOrder: ['thumbnail', 'name', 'status', 'attrib_fps'],
    columnVisibility: { thumbnail: false, name: true, status: true, attrib_fps: true },
    columnPinning: { left: ['name'], right: [] },
    columnSizing: { name: 320, attrib_fps: 80 },
    columnSummaries: { attrib_fps: 'max' },
    sorting: [{ id: 'status', desc: true }],
    groupBy: { id: 'assignees', desc: false },
    groupByConfig: { showEmpty: false },
    rowHeight: 50,
  })

  const restored = loadView(saveView(original, ['thumbnail', 'name', 'status', 'attrib_fps']))

  expect(restored).toMatchObject({
    columnOrder: original.columnOrder,
    columnVisibility: original.columnVisibility,
    columnPinning: original.columnPinning,
    columnSizing: original.columnSizing,
    columnSummaries: original.columnSummaries,
    sorting: original.sorting,
    groupBy: original.groupBy,
    groupByConfig: { showEmpty: false },
    rowHeight: 50,
  })
})

test('right pinned columns load back as left pinned (views only store a boolean)', () => {
  const saved = saveView(
    states({ columnOrder: ['name', 'status'], columnPinning: { left: [], right: ['status'] } }),
  )
  expect(loadView(saved).columnPinning).toEqual({ left: ['status'], right: [] })
})

test.describe('legacy column ids', () => {
  test('are mapped to the current ids everywhere in a saved config', () => {
    const config = normalizeColumnsConfig(
      states({
        columnOrder: ['folderName', 'taskName', 'status', 'folder'],
        columnVisibility: { folderName: true, taskLabel: false },
        columnPinning: { left: ['folder'], right: [] },
        columnSizing: { taskName: 200 },
        sorting: [{ id: 'taskLabel', desc: true }],
      }),
    )
    expect(config.columnOrder).toEqual([ENTITY_COLUMN_IDS.folder, ENTITY_COLUMN_IDS.task, 'status'])
    expect(config.columnVisibility).toEqual({
      [ENTITY_COLUMN_IDS.folder]: true,
      [ENTITY_COLUMN_IDS.task]: false,
    })
    expect(config.columnPinning.left).toEqual([ENTITY_COLUMN_IDS.folder])
    expect(config.columnSizing).toEqual({ [ENTITY_COLUMN_IDS.task]: 200 })
    expect(config.sorting).toEqual([{ id: ENTITY_COLUMN_IDS.task, desc: true }])
  })

  test('the value saved under the current id wins over a legacy one, in any key order', () => {
    const current = ENTITY_COLUMN_IDS.folder
    for (const columnVisibility of [
      { folder: true, [current]: false },
      { [current]: false, folder: true },
    ]) {
      expect(normalizeColumnsConfig(states({ columnVisibility })).columnVisibility).toEqual({
        [current]: false,
      })
    }
  })

  test('table specific aliases take precedence over the built-in ones', () => {
    const config = normalizeColumnsConfig(states({ columnOrder: ['folder', 'name'] }), {
      folder: 'list_folder',
    })
    expect(config.columnOrder).toEqual(['list_folder', 'name'])
  })

  test('a missing config normalizes to an empty one', () => {
    expect(normalizeColumnsConfig(undefined)).toEqual({})
  })
})
