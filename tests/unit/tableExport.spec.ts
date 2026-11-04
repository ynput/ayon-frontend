import { expect, test } from '@playwright/test'
import { resolveColumnVisibility } from '../../shared/src/containers/ProjectTreeTable/utils/checkColumnVisibility'
import { buildSortArgs, getForwardSortBy } from '../../shared/src/util/sortingHelpers'
import { getCsvFileName } from '../../shared/src/containers/TableExport/csvFile'

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

test('selection CSV file name', () => {
  const date = new Date().toLocaleDateString('sv')
  expect(getCsvFileName('proj', ',')).toBe(`proj-selection-${date}.csv`)
  expect(getCsvFileName('proj', '\t')).toBe(`proj-selection-${date}.tsv`)
})
