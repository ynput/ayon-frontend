import { expect, test } from '@playwright/test'
import { endOfDay, startOfDay, subDays } from 'date-fns'
import { sanitizeQueryFilter } from '../../shared/src/containers/ProjectTreeTable/utils/sanitizeQueryFilter'
import {
  createRelativeValue,
  expandRelativeDates,
  isRelativeDateValue,
  resolveRelativeValue,
} from '../../shared/src/containers/ProjectTreeTable/utils/expandRelativeDates'
import { detectRelativeDatePattern } from '../../shared/src/components/SearchFilter/filterDates'

type QueryFilter = Parameters<typeof sanitizeQueryFilter>[0]

test.describe('sanitizeQueryFilter', () => {
  test('drops null values from null checks at any depth, keeps everything else', () => {
    const stored = {
      operator: 'and',
      conditions: [
        { key: 'status', operator: 'isnull', value: null },
        { key: 'name', operator: 'eq', value: 'sh010' },
        {
          operator: 'or',
          conditions: [
            { key: 'attrib.description', operator: 'notnull', value: null },
            { key: 'attrib.description', operator: 'ne', value: '' },
          ],
        },
      ],
    } as unknown as QueryFilter
    const before = JSON.stringify(stored)

    expect(sanitizeQueryFilter(stored)).toEqual({
      operator: 'and',
      conditions: [
        { key: 'status', operator: 'isnull' },
        { key: 'name', operator: 'eq', value: 'sh010' },
        {
          operator: 'or',
          conditions: [
            { key: 'attrib.description', operator: 'notnull' },
            { key: 'attrib.description', operator: 'ne', value: '' },
          ],
        },
      ],
    })
    // the stored filter is not changed
    expect(JSON.stringify(stored)).toBe(before)
  })

  test('a null check that has a real value keeps it', () => {
    const filter: QueryFilter = { conditions: [{ key: 'tags', operator: 'isnull', value: 'x' }] }
    expect(sanitizeQueryFilter(filter)).toEqual(filter)
  })

  test('a filter without conditions stays without conditions', () => {
    expect(sanitizeQueryFilter({ operator: 'and' })).toEqual({
      operator: 'and',
      conditions: undefined,
    })
  })
})

test.describe('relative dates', () => {
  test('relative date values are recognised by their prefix only', () => {
    expect(createRelativeValue('today', 0)).toBe('relative:today:0')
    expect(isRelativeDateValue('relative:last-week:1')).toBe(true)
    for (const value of ['2026-01-01T00:00:00.000Z', 'today', 7, null, undefined, ['relative:']]) {
      expect(isRelativeDateValue(value), String(value)).toBe(false)
    }
  })

  test('resolve to the current start and end of the range', () => {
    const now = new Date()
    expect(resolveRelativeValue('relative:today:0')).toBe(startOfDay(now).toISOString())
    expect(resolveRelativeValue('relative:today:1')).toBe(endOfDay(now).toISOString())
    expect(resolveRelativeValue('relative:yesterday:0')).toBe(
      startOfDay(subDays(now, 1)).toISOString(),
    )
  })

  test('unknown or malformed relative values are passed through unchanged', () => {
    for (const value of [
      'relative:next-century:0',
      'relative:today',
      'relative:today:x',
      'relative:today:0:1',
      'relative:today:5',
    ]) {
      expect(resolveRelativeValue(value)).toBe(value)
    }
  })

  test('expanding a filter resolves relative values at every depth without changing it', () => {
    const filter: QueryFilter = {
      operator: 'and',
      conditions: [
        { key: 'updatedAt', operator: 'gte', value: 'relative:today:0' },
        { key: 'status', operator: 'eq', value: 'relative' },
        {
          operator: 'or',
          conditions: [{ key: 'createdAt', operator: 'lte', value: 'relative:today:1' }],
        },
      ],
    }
    const before = JSON.stringify(filter)
    const now = new Date()

    expect(expandRelativeDates(filter)).toEqual({
      operator: 'and',
      conditions: [
        { key: 'updatedAt', operator: 'gte', value: startOfDay(now).toISOString() },
        { key: 'status', operator: 'eq', value: 'relative' },
        {
          operator: 'or',
          conditions: [{ key: 'createdAt', operator: 'lte', value: endOfDay(now).toISOString() }],
        },
      ],
    })
    expect(JSON.stringify(filter)).toBe(before)

    const empty: QueryFilter = { conditions: [] }
    expect(expandRelativeDates(empty)).toBe(empty)
  })

  test('a picked range is recognised as a preset only when it matches one', () => {
    const now = new Date()
    const yesterday = subDays(now, 1)
    expect(
      detectRelativeDatePattern(startOfDay(now).toISOString(), endOfDay(now).toISOString()),
    ).toEqual({ id: 'today', label: 'Today' })
    expect(
      detectRelativeDatePattern(
        startOfDay(yesterday).toISOString(),
        endOfDay(yesterday).toISOString(),
      ),
    ).toEqual({ id: 'yesterday', label: 'Yesterday' })

    expect(detectRelativeDatePattern('2001-02-03T00:00:00Z', '2001-02-05T00:00:00Z')).toBeNull()
    expect(detectRelativeDatePattern(startOfDay(now).toISOString(), undefined)).toBeNull()
    expect(detectRelativeDatePattern('not a date', endOfDay(now).toISOString())).toBeNull()
  })
})
