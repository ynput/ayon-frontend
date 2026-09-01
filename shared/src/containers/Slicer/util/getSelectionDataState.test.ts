import { describe, expect, test, vi } from 'vitest'
import type { SimpleTableRow } from '@shared/containers/SimpleTable/SimpleTable.types'
import type { SliceMap } from '../types'
import { getSelectionDataState } from './getSelectionDataState'

const row = (id: string): SimpleTableRow => ({ id, name: id, label: id, subRows: [], data: { id } })

const data: SliceMap = new Map([
  ['done', row('done')],
  ['wip', row('wip')],
])

describe('getSelectionDataState', () => {
  test('selected rows are returned keyed by id', () => {
    expect(Object.keys(getSelectionDataState({ done: true, wip: true }, data))).toEqual([
      'done',
      'wip',
    ])
  })

  test('deselected rows are left out', () => {
    expect(Object.keys(getSelectionDataState({ done: true, wip: false }, data))).toEqual(['done'])
  })

  test('a selection the data no longer holds is dropped rather than carried as undefined', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(getSelectionDataState({ deleted: true }, data)).toEqual({})
    expect(warn).toHaveBeenCalled()
  })
})
