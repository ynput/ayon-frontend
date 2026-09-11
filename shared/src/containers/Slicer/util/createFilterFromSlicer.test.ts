import { expect, test } from 'vitest'
import { createFilterFromSlicer, createFiltersFromSlicer } from './createFilterFromSlicer'

const attribFields = [{ name: 'client', data: { type: 'string' } }] as any

const selection = (...ids: string[]) => Object.fromEntries(ids.map((id) => [id, true]))

test('a value panel becomes one OR filter over its selected values', () => {
  const filter = createFilterFromSlicer({
    slice: { sliceType: 'status', rowSelection: selection('In progress', 'Done') },
    attribFields,
  })
  expect(filter!.id).toBe('status')
  expect(filter!.operator).toBe('OR')
  expect(filter!.values!.map((v) => v.id)).toEqual(['In progress', 'Done'])
})

test('deselected rows never reach the filter', () => {
  const filter = createFilterFromSlicer({
    slice: { sliceType: 'status', rowSelection: { Done: true, Blocked: false } },
    attribFields,
  })
  expect(filter!.values!.map((v) => v.id)).toEqual(['Done'])
})

test('attribute panels carry the attribute type', () => {
  const filter = createFilterFromSlicer({
    slice: { sliceType: 'attrib.client' as any, rowSelection: selection('ynput') },
    attribFields,
  })
  expect(filter!.type).toBe('string')
})

test('hierarchy and list panels contribute ids, not filters', () => {
  const filters = createFiltersFromSlicer({
    slices: [
      { sliceType: 'hierarchy', rowSelection: selection('folderId') },
      { sliceType: 'entityList', rowSelection: selection('listId') },
      { sliceType: 'taskType', rowSelection: selection('Lighting') },
    ],
    attribFields,
  })
  expect(filters.map((f) => f.id)).toEqual(['taskType'])
})

test('every value panel produces its own filter, so the query ANDs them', () => {
  const filters = createFiltersFromSlicer({
    slices: [
      { sliceType: 'status', rowSelection: selection('Done') },
      { sliceType: 'taskType', rowSelection: selection('Lighting', 'Comp') },
    ],
    attribFields,
  })
  expect(filters.length).toBe(2)
  expect(filters[1].values!.map((v) => v.id)).toEqual(['Lighting', 'Comp'])
})

test('no panels means no slice filters', () => {
  expect(createFiltersFromSlicer({ slices: [], attribFields })).toEqual([])
})
