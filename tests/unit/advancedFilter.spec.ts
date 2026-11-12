import { expect, test } from '@playwright/test'
import type { Option } from '@ynput/ayon-react-components'
import {
  buildAdvancedFilterFields,
  countAdvancedFilterRules,
  mergeQueryFilters,
  resolveFilterKeyScope,
  splitAdvancedFilterByScope,
} from '../../shared/src/containers/ProjectTreeTable/utils/advancedFilter'
import { sanitizeQueryFilter } from '../../shared/src/containers/ProjectTreeTable/utils/sanitizeQueryFilter'
import { expandRelativeDates } from '../../shared/src/containers/ProjectTreeTable/utils/expandRelativeDates'

type QueryFilter = Parameters<typeof sanitizeQueryFilter>[0]

// stored trees can hold operators and values the generated types don't list yet
const tree = (filter: unknown) => filter as QueryFilter

const textEmpty = (key: string) => ({
  operator: 'or',
  conditions: [
    { key, operator: 'isnull' },
    { key, operator: 'eq', value: '' },
  ],
})
const textNotEmpty = (key: string) => ({
  operator: 'and',
  conditions: [
    { key, operator: 'notnull' },
    { key, operator: 'ne', value: '' },
  ],
})

const silenceWarnings = () => {
  const warn = console.warn
  const warnings: unknown[][] = []
  console.warn = (...args: unknown[]) => warnings.push(args)
  return {
    warnings,
    restore: () => {
      console.warn = warn
    },
  }
}

test.describe('countAdvancedFilterRules', () => {
  test('counts conditions at every depth', () => {
    expect(
      countAdvancedFilterRules(
        tree({
          operator: 'and',
          conditions: [
            { key: 'task_status', operator: 'in', value: ['Done'] },
            {
              operator: 'or',
              conditions: [
                { key: 'task_tags', operator: 'includesany', value: ['a'] },
                { key: 'task_assignees', operator: 'eq', value: [] },
                {
                  operator: 'and',
                  conditions: [{ key: 'task_name', operator: 'like', value: 'x' }],
                },
              ],
            },
          ],
        }),
      ),
    ).toBe(4)
  })

  test('the text empty and not empty pairs are one rule each', () => {
    expect(
      countAdvancedFilterRules(
        tree({
          operator: 'and',
          conditions: [textEmpty('attrib.description'), textNotEmpty('name')],
        }),
      ),
    ).toBe(2)
  })

  test('a group that only looks like a pair counts its conditions', () => {
    const otherKey = {
      operator: 'or',
      conditions: [
        { key: 'a', operator: 'isnull' },
        { key: 'b', operator: 'eq', value: '' },
      ],
    }
    const otherOperator = { ...textEmpty('a'), operator: 'and' }
    expect(countAdvancedFilterRules(tree({ conditions: [otherKey, otherOperator] }))).toBe(4)
  })

  test('nothing stored is no rules', () => {
    expect(countAdvancedFilterRules(undefined)).toBe(0)
    expect(countAdvancedFilterRules(null)).toBe(0)
    expect(countAdvancedFilterRules({})).toBe(0)
    expect(countAdvancedFilterRules({ operator: 'and', conditions: [] })).toBe(0)
  })
})

test.describe('mergeQueryFilters', () => {
  const simple: QueryFilter = {
    operator: 'and',
    conditions: [{ key: 'status', operator: 'in', value: ['Done'] }],
  }
  const advanced: QueryFilter = {
    operator: 'or',
    conditions: [
      { key: 'tags', operator: 'includesany', value: ['a'] },
      { key: 'tags', operator: 'includesany', value: ['b'] },
    ],
  }

  test('wraps both sides in an and group, each kept whole', () => {
    expect(mergeQueryFilters(simple, advanced)).toEqual({
      operator: 'and',
      conditions: [simple, advanced],
    })
  })

  test('without the second filter the first is returned as it is', () => {
    const empty: QueryFilter = { conditions: [] }
    expect(mergeQueryFilters(simple, undefined)).toBe(simple)
    expect(mergeQueryFilters(simple, null)).toBe(simple)
    expect(mergeQueryFilters(simple, {})).toBe(simple)
    expect(mergeQueryFilters(simple, empty)).toBe(simple)
    expect(mergeQueryFilters(empty, empty)).toBe(empty)
    expect(mergeQueryFilters(undefined, undefined)).toBeUndefined()
  })

  test('without the first filter the result still has an and root', () => {
    const and: QueryFilter = { operator: 'and', conditions: advanced.conditions }
    expect(mergeQueryFilters({ conditions: [] }, and)).toBe(and)
    expect(mergeQueryFilters(undefined, advanced)).toEqual({
      operator: 'and',
      conditions: [advanced],
    })
  })
})

test.describe('splitAdvancedFilterByScope', () => {
  const scopes = ['task', 'folder'] as const

  test('resolves the scope by prefix, or the fallback scope', () => {
    expect(resolveFilterKeyScope('folder_attrib.fps', scopes)).toEqual({
      scope: 'folder',
      key: 'attrib.fps',
    })
    expect(resolveFilterKeyScope('status', scopes)).toEqual({ scope: null, key: 'status' })
    expect(resolveFilterKeyScope('status', scopes, 'task')).toEqual({
      scope: 'task',
      key: 'status',
    })
    // only a whole prefix counts
    expect(resolveFilterKeyScope('taskType', scopes)).toEqual({ scope: null, key: 'taskType' })
  })

  test('a mixed and root is split per scope and groups of one scope stay whole', () => {
    const stored = tree({
      operator: 'and',
      conditions: [
        { key: 'task_status', operator: 'in', value: ['Done'] },
        { key: 'folder_folderType', operator: 'in', value: ['Shot'] },
        {
          operator: 'or',
          conditions: [
            { key: 'task_attrib.priority', operator: 'in', value: ['high'] },
            textEmpty('task_attrib.description'),
          ],
        },
      ],
    })
    const before = JSON.stringify(stored)

    expect(splitAdvancedFilterByScope(stored, scopes)).toEqual({
      task: {
        operator: 'and',
        conditions: [
          { key: 'status', operator: 'in', value: ['Done'] },
          {
            operator: 'or',
            conditions: [
              { key: 'attrib.priority', operator: 'in', value: ['high'] },
              textEmpty('attrib.description'),
            ],
          },
        ],
      },
      folder: {
        operator: 'and',
        conditions: [{ key: 'folderType', operator: 'in', value: ['Shot'] }],
      },
    })
    expect(JSON.stringify(stored)).toBe(before)
  })

  test('a nested mixed and group is split into one group per scope', () => {
    const stored = tree({
      operator: 'and',
      conditions: [
        {
          operator: 'and',
          conditions: [
            { key: 'task_status', operator: 'in', value: ['Done'] },
            { key: 'folder_status', operator: 'notin', value: ['Omitted'] },
          ],
        },
      ],
    })
    expect(splitAdvancedFilterByScope(stored, scopes)).toEqual({
      task: {
        operator: 'and',
        conditions: [
          { operator: 'and', conditions: [{ key: 'status', operator: 'in', value: ['Done'] }] },
        ],
      },
      folder: {
        operator: 'and',
        conditions: [
          {
            operator: 'and',
            conditions: [{ key: 'status', operator: 'notin', value: ['Omitted'] }],
          },
        ],
      },
    })
  })

  test('an or group across scopes is dropped with a warning, the rest is kept', () => {
    const stored = tree({
      operator: 'and',
      conditions: [
        { key: 'folder_status', operator: 'in', value: ['Done'] },
        {
          operator: 'or',
          conditions: [
            { key: 'task_status', operator: 'in', value: ['Done'] },
            { key: 'folder_tags', operator: 'includesany', value: ['a'] },
          ],
        },
      ],
    })
    const log = silenceWarnings()
    const result = splitAdvancedFilterByScope(stored, scopes)
    log.restore()

    expect(result).toEqual({
      folder: { operator: 'and', conditions: [{ key: 'status', operator: 'in', value: ['Done'] }] },
    })
    expect(log.warnings).toHaveLength(1)
  })

  test('an or root of one scope goes whole to that scope', () => {
    const stored = tree({
      operator: 'or',
      conditions: [
        { key: 'task_status', operator: 'in', value: ['Done'] },
        { key: 'task_tags', operator: 'includesany', value: ['a'] },
      ],
    })
    expect(splitAdvancedFilterByScope(stored, scopes)).toEqual({
      task: {
        operator: 'or',
        conditions: [
          { key: 'status', operator: 'in', value: ['Done'] },
          { key: 'tags', operator: 'includesany', value: ['a'] },
        ],
      },
    })
  })

  test('keys without a prefix go to the fallback scope, or are dropped without one', () => {
    const stored = tree({ operator: 'and', conditions: [{ key: 'status', operator: 'isnull' }] })
    expect(splitAdvancedFilterByScope(stored, scopes, 'task')).toEqual({
      task: { operator: 'and', conditions: [{ key: 'status', operator: 'isnull' }] },
    })

    const log = silenceWarnings()
    expect(splitAdvancedFilterByScope(stored, scopes)).toEqual({})
    log.restore()
    expect(log.warnings).toHaveLength(1)
  })

  test('nothing stored gives no filters', () => {
    expect(splitAdvancedFilterByScope(undefined, scopes)).toEqual({})
    expect(splitAdvancedFilterByScope({ operator: 'and', conditions: [] }, scopes)).toEqual({})
  })
})

test.describe('advanced filter requests', () => {
  // the shapes the editor stores, per operator
  const stored = tree({
    operator: 'and',
    conditions: [
      { key: 'name', operator: 'like', value: 'sh' },
      { key: 'name', operator: 'notlike', value: 'sh' },
      { key: 'name', operator: 'eq', value: '' },
      { key: 'name', operator: 'startswith', value: 'sh' },
      { key: 'name', operator: 'endswith', value: '10' },
      textEmpty('attrib.description'),
      textNotEmpty('attrib.description'),
      { key: 'status', operator: 'in', value: ['Done'] },
      { key: 'status', operator: 'notin', value: ['Done'] },
      { key: 'status', operator: 'isnull' },
      { key: 'status', operator: 'notnull' },
      { key: 'tags', operator: 'includesany', value: ['a'] },
      { key: 'tags', operator: 'includesall', value: ['a'] },
      { key: 'tags', operator: 'excludesany', value: ['a'] },
      { key: 'tags', operator: 'eq', value: [] },
      { key: 'tags', operator: 'ne', value: [] },
      { key: 'attrib.fps', operator: 'gte', value: 0 },
      { key: 'attrib.fps', operator: 'eq', value: 25 },
      { key: 'attrib.done', operator: 'eq', value: true },
      { key: 'attrib.done', operator: 'ne', value: true },
      { key: 'createdAt', operator: 'lt', value: '2026-01-01T00:00:00.000Z' },
    ],
  })

  test('every stored shape is sent unchanged', () => {
    expect(sanitizeQueryFilter(expandRelativeDates(stored))).toEqual(stored)
  })

  test('null values of null checks and relative dates are resolved in nested groups', () => {
    const nested = tree({
      operator: 'and',
      conditions: [
        {
          operator: 'or',
          conditions: [
            { key: 'status', operator: 'isnull', value: null },
            {
              operator: 'and',
              conditions: [{ key: 'createdAt', operator: 'gt', value: 'relative:today:0' }],
            },
          ],
        },
      ],
    })
    const sent = sanitizeQueryFilter(expandRelativeDates(nested)) as any
    const [nullCheck, group] = sent.conditions[0].conditions
    expect(nullCheck).toEqual({ key: 'status', operator: 'isnull' })
    expect(group.conditions[0].value).not.toContain('relative')
    expect(new Date(group.conditions[0].value).toString()).not.toBe('Invalid Date')
  })
})

test.describe('buildAdvancedFilterFields', () => {
  const group = (name: string) => ({ name, label: name[0].toUpperCase() + name.slice(1) })
  const options: Option[] = [
    {
      id: 'task_status',
      type: 'string',
      label: 'Status',
      icon: 'arrow_circle_right',
      allowsCustomValues: false,
      group: group('task'),
      values: [{ id: 'Done', label: 'Done', icon: 'check', color: '#0f0', pt: {} }],
    },
    { id: 'task_name', type: 'string', label: 'Name', allowsCustomValues: true, values: [] },
    {
      id: 'task_assignees',
      type: 'list_of_strings',
      label: 'Assignee',
      group: group('task'),
      values: [{ id: 'jane', label: 'Jane', img: '/api/users/jane/avatar', icon: null }],
    },
    { id: 'folder_tags', type: 'list_of_strings', label: 'Tags', allowsCustomValues: true },
    {
      id: 'folder_attrib.fps',
      type: 'float',
      label: 'FPS',
      allowsCustomValues: true,
      group: group('folder'),
      values: [{ id: '25', label: '25' }],
    },
    {
      id: 'folder_attrib.done',
      type: 'boolean',
      label: 'Done',
      values: [
        { id: 'true', label: 'Yes' },
        { id: 'false', label: 'No' },
      ],
    },
    {
      id: 'task_createdAt',
      type: 'datetime',
      label: 'Created',
      values: [{ id: 'today', label: 'Today' }],
    },
    {
      id: 'task_attrib.priority',
      type: 'string',
      label: 'Priority',
      allowsCustomValues: true,
      values: [{ id: 'high', label: 'High' }],
    },
    {
      id: 'task_attrib.resolved',
      type: 'string',
      label: 'Resolved',
      allowsCustomValues: true,
      loadValues: async () => [{ id: 'a', label: 'A', pt: {} }],
    },
    { id: 'task_attrib.data', type: 'dict', label: 'Data' },
    { id: 'version_hasReviewables', type: 'boolean', label: 'Has Reviewables' },
  ]

  const fields = buildAdvancedFilterFields(options, {
    scopes: ['task', 'folder'],
    exclude: ['version_hasReviewables'],
  })
  const field = (key: string) => fields.find((f) => f.key === key)

  test('keeps the option ids as keys and leaves out excluded and unsupported options', () => {
    expect(fields.map((f) => f.key)).toEqual([
      'task_status',
      'task_name',
      'task_assignees',
      'folder_tags',
      'folder_attrib.fps',
      'folder_attrib.done',
      'task_createdAt',
      'task_attrib.priority',
      'task_attrib.resolved',
    ])
  })

  test('normalises the types', () => {
    expect(fields.map((f) => f.type)).toEqual([
      'enum',
      'string',
      'list',
      'list',
      'float',
      'boolean',
      'datetime',
      'enum',
      'enum',
    ])
  })

  test('passes values only to fields compared with ids', async () => {
    expect(field('task_status')).toEqual({
      key: 'task_status',
      label: 'Status',
      icon: 'arrow_circle_right',
      type: 'enum',
      scope: 'task',
      scopeLabel: 'Task',
      allowsCustomValues: false,
      values: [{ id: 'Done', label: 'Done', icon: 'check', color: '#0f0', img: undefined }],
    })
    expect(field('task_assignees')?.values?.[0].img).toBe('/api/users/jane/avatar')
    expect(field('task_attrib.priority')?.allowsCustomValues).toBe(true)
    expect(field('task_name')?.values).toBeUndefined()
    for (const key of ['folder_attrib.fps', 'folder_attrib.done', 'task_createdAt']) {
      expect(field(key)?.values, key).toBeUndefined()
      expect(field(key)?.allowsCustomValues, key).toBeUndefined()
    }
    expect(await field('task_attrib.resolved')?.loadValues?.()).toEqual([
      { id: 'a', label: 'A', icon: undefined, color: undefined, img: undefined },
    ])
  })

  test('scope comes from the group of a multi-scope page only', () => {
    expect(field('folder_attrib.fps')?.scope).toBe('folder')
    expect(field('task_name')?.scope).toBeUndefined()
    const single = buildAdvancedFilterFields(options, { scopes: ['task'] })
    expect(single.every((f) => f.scope === undefined && f.scopeLabel === undefined)).toBe(true)
    expect(buildAdvancedFilterFields(options).some((f) => f.key === 'version_hasReviewables')).toBe(
      true,
    )
  })
})
