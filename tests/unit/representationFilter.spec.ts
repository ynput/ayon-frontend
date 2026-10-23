import { expect, test } from '@playwright/test'
import { resolveExtensionFilter } from '../../src/pages/VersionsProductsPage/util/resolveExtensionFilter'

type QueryFilter = Parameters<typeof resolveExtensionFilter>[0]

const resolve = (filter: unknown) => resolveExtensionFilter(filter as QueryFilter)

test.describe('resolveExtensionFilter', () => {
  test('matches the extension against the end of the path', () => {
    expect(
      resolve({
        operator: 'and',
        conditions: [{ key: 'extension', operator: 'like', value: '%exr%' }],
      }),
    ).toEqual({
      operator: 'and',
      conditions: [{ key: 'attrib.path', operator: 'like', value: '%.exr' }],
    })
  })

  test('accepts a leading dot and surrounding spaces', () => {
    for (const value of ['%.exr%', '% exr %', '%..exr%']) {
      expect(resolve({ conditions: [{ key: 'extension', operator: 'like', value }] })).toEqual({
        conditions: [{ key: 'attrib.path', operator: 'like', value: '%.exr' }],
      })
    }
  })

  test('escapes like wildcards in the extension', () => {
    expect(
      resolve({ conditions: [{ key: 'extension', operator: 'like', value: '%tar_gz%' }] }),
    ).toEqual({
      conditions: [{ key: 'attrib.path', operator: 'like', value: '%.tar\\_gz' }],
    })
  })

  test('turns several values into an or group', () => {
    expect(
      resolve({ conditions: [{ key: 'extension', operator: 'in', value: ['exr', 'abc'] }] }),
    ).toEqual({
      conditions: [
        {
          operator: 'or',
          conditions: [
            { key: 'attrib.path', operator: 'like', value: '%.exr' },
            { key: 'attrib.path', operator: 'like', value: '%.abc' },
          ],
        },
      ],
    })
  })

  test('resolves nested groups and leaves other conditions alone', () => {
    const name = { key: 'name', operator: 'like', value: '%review%' }
    const filter = {
      operator: 'and',
      conditions: [
        {
          operator: 'or',
          conditions: [
            { key: 'extension', operator: 'like', value: '%exr%' },
            { key: 'extension', operator: 'like', value: '%usd%' },
          ],
        },
        name,
        { key: 'attrib.extension', operator: 'eq', value: 'exr' },
      ],
    }
    const before = JSON.stringify(filter)

    expect(resolve(filter)).toEqual({
      operator: 'and',
      conditions: [
        {
          operator: 'or',
          conditions: [
            { key: 'attrib.path', operator: 'like', value: '%.exr' },
            { key: 'attrib.path', operator: 'like', value: '%.usd' },
          ],
        },
        name,
        { key: 'attrib.extension', operator: 'eq', value: 'exr' },
      ],
    })
    expect(JSON.stringify(filter)).toBe(before)
  })

  test('drops an extension condition without a value', () => {
    expect(
      resolve({
        conditions: [
          { key: 'extension', operator: 'like', value: '%%' },
          { key: 'status', operator: 'in', value: ['Approved'] },
        ],
      }),
    ).toEqual({ conditions: [{ key: 'status', operator: 'in', value: ['Approved'] }] })
    expect(resolve({ conditions: [] })).toEqual({ conditions: [] })
  })
})
