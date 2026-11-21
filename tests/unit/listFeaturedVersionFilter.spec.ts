import { expect, test } from '@playwright/test'
import { extractFeaturedVersionFilter } from '../../src/pages/ProjectListsPage/util/featuredVersionFilter'

const status = { key: 'entity_status', operator: 'in', value: ['Approved'] } as const

test('Latest Done is sent as featuredOnly, not as a version number', () => {
  const { filters, featuredOnly } = extractFeaturedVersionFilter({
    operator: 'and',
    conditions: [{ key: 'entity_version', operator: 'in', value: ['latestDone'] }, status],
  })
  expect(featuredOnly).toEqual(['latestDone'])
  expect(filters.conditions).toEqual([status])
})

test('version numbers stay in the filter next to featured values', () => {
  const { filters, featuredOnly } = extractFeaturedVersionFilter({
    operator: 'and',
    conditions: [{ key: 'entity_version', operator: 'in', value: ['hero', 'latest', '3'] }],
  })
  expect(featuredOnly).toEqual(['hero', 'latest'])
  expect(filters.conditions).toEqual([{ key: 'entity_version', operator: 'in', value: '3' }])
})

test('filters without featured values are unchanged', () => {
  const { filters, featuredOnly } = extractFeaturedVersionFilter({
    operator: 'and',
    conditions: [status],
  })
  expect(featuredOnly).toBeUndefined()
  expect(filters.conditions).toEqual([status])
})
