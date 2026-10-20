import { expect, test } from '@playwright/test'
import { getTableFieldOptions } from '../../shared/src/containers/ProjectTreeTable/utils/getTableFieldOptions'

const assigneeLabels = (users: { name: string; fullName?: string | null }[]) =>
  getTableFieldOptions({
    users,
    statuses: [],
    folderTypes: [],
    taskTypes: [],
    productTypes: [],
    tags: [],
    scopes: [],
  }).assignee.map((option) => option.label)

test('assignees are sorted by the label the dropdown shows', () => {
  expect(
    assigneeLabels([
      { name: 'aaa', fullName: 'Zoe' },
      { name: 'zzz', fullName: 'Adam' },
      { name: 'mike' },
      { name: 'bob', fullName: '  ' },
      { name: 'nina', fullName: null },
    ]),
  ).toEqual(['Adam', 'bob', 'mike', 'nina', 'Zoe'])
})

test('assignee sort ignores case and accents, and orders numbers naturally', () => {
  expect(
    assigneeLabels([
      { name: 'u1', fullName: 'user 10' },
      { name: 'u2', fullName: 'Émile' },
      { name: 'u3', fullName: 'user 2' },
      { name: 'u4', fullName: 'eve' },
      { name: 'u5', fullName: 'Dan' },
    ]),
  ).toEqual(['Dan', 'Émile', 'eve', 'user 2', 'user 10'])
})
