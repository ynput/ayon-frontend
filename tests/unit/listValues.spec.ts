import { expect, test } from '@playwright/test'
import { communityListValueRules } from '../../src/pages/ProjectListsPage/listValues/communityListValueRules'
import { toEntityValueKeys } from '../../src/pages/ProjectListsPage/listValues/entityValueFilter'
import { formatListValue } from '../../src/pages/ProjectListsPage/listValues/formatListValue'
import { toListValuesItem } from '../../src/pages/ProjectListsPage/listValues/listItemValueSources'
import {
  patchListItemEntityValues,
  patchListItemListValues,
} from '../../shared/src/api/queries/entityLists/listItemValues'

const context = {
  listAttributes: ['cutOrder'],
  formatValue: (_attrib: string, value: unknown) => String(value),
}

// villain: the folder has priority high, the list item overrides it with low
const villain = {
  listAttrib: { priority: 'low', cutOrder: 9 },
  entityAttrib: { priority: 'high', fps: 25 },
  entityOwnAttrib: ['priority'],
}

test.describe('community list values', () => {
  test('show the entity values and only the list attributes from the list item', () => {
    const { attrib, ownAttrib, marks } = communityListValueRules.resolveValues(villain, context)
    expect(attrib).toEqual({ priority: 'high', fps: 25, cutOrder: 9 })
    expect(ownAttrib).toEqual(['priority', 'cutOrder'])
    expect(marks).toEqual({})
  })

  test('write entity attributes to the entity and list attributes to the list item', () => {
    expect(communityListValueRules.getEditTarget('priority', context)).toBe('entity')
    expect(communityListValueRules.getEditTarget('cutOrder', context)).toBe('listItem')
  })
})

test.describe('toListValuesItem', () => {
  test('hands the module the values of an item and leaves restricted entities out', () => {
    const item = {
      id: 'item1',
      entityId: 'villain',
      entityType: 'folder',
      name: 'villain',
      listAttrib: { priority: 'low' },
      entityAttrib: { priority: 'high' },
      ownAttrib: ['priority'],
    }
    expect(toListValuesItem(item)).toEqual({
      id: 'item1',
      entityId: 'villain',
      entityType: 'folder',
      listAttrib: { priority: 'low' },
      entityAttrib: { priority: 'high' },
      entityOwnAttrib: ['priority'],
    })
    expect(toListValuesItem({ ...item, entityType: 'unknown' })).toBeUndefined()
    expect(toListValuesItem({ ...item, name: undefined })).toBeUndefined()
  })
})

test.describe('toEntityValueKeys', () => {
  test('moves conditions on entity values to entityAttrib at any depth', () => {
    const filter = {
      operator: 'and' as const,
      conditions: [
        { key: 'attrib.priority', operator: 'eq' as const, value: 'high' },
        { key: 'attrib.cutOrder', operator: 'gt' as const, value: 3 },
        { key: 'entity_status', operator: 'eq' as const, value: 'Approved' },
        {
          operator: 'or' as const,
          conditions: [{ key: 'attrib.fps', operator: 'eq' as const, value: 25 }],
        },
      ],
    }
    const readsEntityValue = (attrib: string) => attrib !== 'cutOrder'
    expect(toEntityValueKeys(filter, readsEntityValue)).toEqual({
      operator: 'and',
      conditions: [
        { key: 'entityAttrib.priority', operator: 'eq', value: 'high' },
        { key: 'attrib.cutOrder', operator: 'gt', value: 3 },
        { key: 'entity_status', operator: 'eq', value: 'Approved' },
        { operator: 'or', conditions: [{ key: 'entityAttrib.fps', operator: 'eq', value: 25 }] },
      ],
    })
  })

  test('leaves the filter alone without a mapping', () => {
    const filter = { conditions: [{ key: 'attrib.priority', value: 'high' }] }
    expect(toEntityValueKeys(filter)).toBe(filter)
  })
})

test.describe('cached list item values', () => {
  const cached = () => ({
    attrib: { priority: 'low', fps: 25 },
    listAttrib: { priority: 'low' } as Record<string, unknown>,
    entityAttrib: { priority: 'high', fps: 25 } as Record<string, unknown>,
  })

  test('a list value shows over the entity value, removing it falls back to the entity', () => {
    const item = cached()
    patchListItemListValues(item, { fps: 24 })
    expect(item.attrib).toEqual({ priority: 'low', fps: 24 })
    expect(item.listAttrib).toEqual({ priority: 'low', fps: 24 })

    patchListItemListValues(item, { priority: null })
    expect(item.attrib).toEqual({ priority: 'high', fps: 24 })
    expect(item.listAttrib).toEqual({ fps: 24 })
  })

  test('an entity value changes the shown value only without a list value', () => {
    const item = cached()
    patchListItemEntityValues(item, { priority: 'urgent', fps: 30 })
    expect(item.entityAttrib).toEqual({ priority: 'urgent', fps: 30 })
    expect(item.attrib).toEqual({ priority: 'low', fps: 30 })
  })
})

test.describe('formatListValue', () => {
  const priority = {
    data: {
      type: 'string',
      enum: [
        { value: 'high', label: 'High' },
        { value: 'low', label: 'Low' },
      ],
    },
  }

  test('uses enum labels and says when nothing is set', () => {
    expect(formatListValue(priority, 'high')).toBe('High')
    expect(formatListValue(priority, ['high', 'low'])).toBe('High, Low')
    expect(formatListValue(priority, null)).toBe('not set')
    expect(formatListValue(undefined, 25)).toBe('25')
    expect(formatListValue(undefined, false)).toBe('no')
  })
})
