import { expect, test } from '@playwright/test'
import {
  extractFeaturedVersionFilter,
  splitFeaturedVersionFilter,
} from '../../src/pages/ProjectListsPage/util/featuredVersionFilter'

const status = { key: 'entity_status', operator: 'in', value: ['Approved'] } as const

test('Latest Done is sent as featuredOnly, not as a version number', () => {
  const { filters, featuredOnly } = extractFeaturedVersionFilter({
    operator: 'and',
    conditions: [{ key: 'entity_version', operator: 'in', value: ['latestDone'] }, status],
  })
  expect(featuredOnly).toEqual(['latestDone'])
  expect(filters.conditions).toEqual([status])
})

test('version numbers stay in the filter next to featured values, as a list', () => {
  const { filters, featuredOnly } = extractFeaturedVersionFilter({
    operator: 'and',
    conditions: [{ key: 'entity_version', operator: 'in', value: ['hero', 'latest', '3'] }],
  })
  expect(featuredOnly).toEqual(['hero', 'latest'])
  expect(filters.conditions).toEqual([{ key: 'entity_version', operator: 'in', value: ['3'] }])
})

test('filters without featured values are unchanged', () => {
  const { filters, featuredOnly } = extractFeaturedVersionFilter({
    operator: 'and',
    conditions: [status],
  })
  expect(featuredOnly).toBeUndefined()
  expect(filters.conditions).toEqual([status])
})

test('an excluded featured value is dropped, never sent as featuredOnly', () => {
  const { filters, featuredOnly } = extractFeaturedVersionFilter({
    operator: 'and',
    conditions: [{ key: 'entity_version', operator: 'notin', value: ['latest', '3'] }, status],
  })
  expect(featuredOnly).toBeUndefined()
  expect(filters.conditions).toEqual([
    { key: 'entity_version', operator: 'notin', value: ['3'] },
    status,
  ])
})

test('the filter string is split for a request, also inside a nested filter', () => {
  const listsFilter = JSON.stringify({
    operator: 'and',
    conditions: [{ key: 'entity_version', operator: 'in', value: ['latestDone'] }],
  })
  expect(splitFeaturedVersionFilter(listsFilter)).toEqual({
    filter: undefined,
    featuredOnly: ['latestDone'],
  })

  // the deep link check wraps the Lists filter with the item ids
  const ids = { key: 'id', operator: 'in', value: ['a'] }
  const { filter, featuredOnly } = splitFeaturedVersionFilter(
    JSON.stringify({ operator: 'and', conditions: [ids, JSON.parse(listsFilter)] }),
  )
  expect(featuredOnly).toEqual(['latestDone'])
  expect(JSON.parse(filter!).conditions[0]).toEqual(ids)
  expect(splitFeaturedVersionFilter(undefined)).toEqual({})
})
