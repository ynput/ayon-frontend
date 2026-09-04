import { describe, expect, test, vi } from 'vitest'
import type { Filter } from '@ynput/ayon-react-components'
import type { QueryCondition, QueryFilter } from '../types/operations'
// the hook reaches for two barrels that drag in the whole api layer; the utils it
// actually uses are re-exported here for real, the api import is types only
vi.mock('@shared/api', () => ({}))
vi.mock('../utils', async () => ({
  ...(await import('../utils/clientFilterToQueryFilter')),
  ...(await import('../utils/expandRelativeDates')),
  ...(await import('../utils/sanitizeQueryFilter')),
}))

const { buildQueryFilters } = await import('./useQueryFilters')

const empty: QueryFilter = { conditions: [], operator: 'and' }

const sliceFilter = (id: string, ...values: string[]): Filter => ({
  id,
  label: id,
  type: 'string',
  inverted: false,
  operator: 'OR',
  values: values.map((value) => ({ id: value, label: value })),
})

const keysOf = (filter: QueryFilter) =>
  (filter.conditions ?? []).map((condition) => (condition as QueryCondition).key)

describe('buildQueryFilters', () => {
  test('each slice panel adds its own condition and they are ANDed', () => {
    const { combinedFilters } = buildQueryFilters({
      queryFilters: empty,
      sliceFilters: [sliceFilter('status', 'Done'), sliceFilter('taskType', 'Lighting')],
    })
    expect(keysOf(combinedFilters)).toEqual(['status', 'taskType'])
    expect(combinedFilters.operator).toBe('and')
  })

  test('a panel with nothing selected does not restrict the query', () => {
    const { combinedFilters, filterString } = buildQueryFilters({
      queryFilters: empty,
      sliceFilters: [sliceFilter('status')],
    })
    expect(keysOf(combinedFilters)).toEqual([])
    expect(filterString).toBe('')
  })

  test('slice conditions are added on top of the search bar filters', () => {
    const { combinedFilters } = buildQueryFilters({
      queryFilters: {
        conditions: [{ key: 'attrib.client', value: ['ynput'], operator: 'in' }],
        operator: 'and',
      },
      sliceFilters: [sliceFilter('status', 'Done')],
    })
    expect(keysOf(combinedFilters)).toEqual(['attrib.client', 'status'])
  })

  test('slice filters stay out of what the search bar displays', () => {
    const { displayFilters } = buildQueryFilters({
      queryFilters: empty,
      sliceFilters: [sliceFilter('status', 'Done')],
    })
    expect(keysOf(displayFilters)).toEqual([])
  })

  test('the pinned single-slice filter still applies alongside the panels', () => {
    const { combinedFilters } = buildQueryFilters({
      queryFilters: empty,
      sliceFilter: sliceFilter('assignees', 'jane'),
      sliceFilters: [sliceFilter('status', 'Done')],
    })
    expect(keysOf(combinedFilters)).toEqual(['assignees', 'status'])
  })
})
