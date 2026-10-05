import { expect, test } from '@playwright/test'
import {
  checkColumnVisibility,
  ensureAtLeastOneVisibleColumn,
} from '../../shared/src/containers/ProjectTreeTable/utils/checkColumnVisibility'
import {
  DRAG_HANDLE_COLUMN_ID,
  ROW_SELECTION_COLUMN_ID,
} from '../../shared/src/containers/ProjectTreeTable/constants'

test('row selection and drag handle columns are always visible', () => {
  for (const id of [ROW_SELECTION_COLUMN_ID, DRAG_HANDLE_COLUMN_ID]) {
    expect(checkColumnVisibility({ [id]: false }, id, { [id]: false })).toBe(true)
  }
})

test('the saved state of a column wins over the defaults', () => {
  expect(checkColumnVisibility({ status: false }, 'status', { status: true })).toBe(false)
  expect(checkColumnVisibility({ status: true }, 'status', { status: false })).toBe(true)
})

test('a column without saved state uses its default, and is hidden without one', () => {
  expect(checkColumnVisibility({}, 'status', { status: true })).toBe(true)
  expect(checkColumnVisibility({}, 'status', { status: false })).toBe(false)
  expect(checkColumnVisibility({}, 'status')).toBe(false)
  // null comes back from older saved views and counts as "no state"
  const saved = { status: null } as unknown as Record<string, boolean>
  expect(checkColumnVisibility(saved, 'status', { status: true })).toBe(true)
})

test('a wildcard field is visible when any matching saved column is visible', () => {
  expect(checkColumnVisibility({ link_a_in: false, link_b_out: true }, 'link_*')).toBe(true)
  expect(checkColumnVisibility({ link_a_in: false, link_b_out: false }, 'link_*')).toBe(false)
})

test('a wildcard default applies to every column it matches', () => {
  const defaults = { 'link_*': false, 'attrib_*': true }
  expect(checkColumnVisibility({}, 'link_depends_in', defaults)).toBe(false)
  expect(checkColumnVisibility({}, 'attrib_fps', defaults)).toBe(true)
  expect(checkColumnVisibility({}, 'status', defaults)).toBe(false)
})

// FLAG: the prefix match meant for `name_*` style ids also runs for plain ids, so a column with
// no saved state takes the visibility of any saved column whose id starts with its own id.
// Columns added after the view was last saved (a new attribute or link type) are then listed as
// visible in the column settings and skipped by "show column" deep links, while the table itself
// (which calls checkColumnVisibility({}, id)) hides them. checkColumnVisibility.ts:32-39
test.fixme('a plain column id does not inherit the visibility of a longer id it prefixes', () => {
  expect(checkColumnVisibility({ attrib_frameStart: true }, 'attrib_frame')).toBe(false)
  expect(checkColumnVisibility({ productType: true }, 'product')).toBe(false)
})

test.describe('at least one visible column', () => {
  test('falls back to showing the name column when nothing else is visible', () => {
    const ids = [ROW_SELECTION_COLUMN_ID, 'name', 'status']
    // the always visible columns do not count
    const visibility = { [ROW_SELECTION_COLUMN_ID]: true, name: false, status: false }
    expect(ensureAtLeastOneVisibleColumn(visibility, ids)).toEqual({ ...visibility, name: true })
  })

  test('leaves the visibility alone when a column is visible or there is no name column', () => {
    const visible = { name: false, status: true }
    expect(ensureAtLeastOneVisibleColumn(visible, ['name', 'status'])).toBe(visible)

    const noName = { status: false }
    expect(ensureAtLeastOneVisibleColumn(noName, ['status'])).toBe(noName)
  })
})
