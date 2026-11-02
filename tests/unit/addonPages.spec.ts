import { expect, test } from '@playwright/test'
import { selectAddonPages } from '../../src/remote/AddonPagesHelpers'

// Which project.page contributions get a tab: built-in pages win on an id or view type clash,
// except a built-in page its own addon takes over (OWNED_BUILT_IN_PAGES: `reports`).

const page = (
  addonName: string,
  id: string,
  viewType?: string,
  slot: 'project.page' | 'studio.page' = 'project.page',
) =>
  ({
    slot,
    id,
    title: id,
    viewType,
    key: `${addonName}.${id}`,
    addon: { name: addonName, version: '1.0.0', remote: addonName },
  }) as never

const BUILT_IN = ['overview', 'reports']
const ids = (pages: { key: string }[]) => pages.map((p) => p.key)

test('the reports addon takes over the built-in reports page and its view type', () => {
  expect(ids(selectAddonPages([page('reports', 'reports', 'reports')], BUILT_IN))).toEqual([
    'reports.reports',
  ])
})

test('another addon cannot take a built-in page or its view type', () => {
  const pages = [page('other', 'reports'), page('other', 'charts', 'reports')]
  expect(ids(selectAddonPages(pages, BUILT_IN))).toEqual([])
})

test('the owning addon keeps the built-in view type only on its owned page', () => {
  const pages = [page('reports', 'extra', 'reports'), page('reports', 'overview')]
  expect(ids(selectAddonPages(pages, BUILT_IN))).toEqual([])
})

test('an earlier addon page keeps the id over a later owned claim', () => {
  // an addon page can only reach the id when it isn't reserved, e.g. on a host without it
  const pages = [page('other', 'reports'), page('reports', 'reports', 'reports')]
  expect(ids(selectAddonPages(pages, ['overview']))).toEqual(['other.reports'])
})

test('a studio page cannot claim an owned built-in id or view type', () => {
  // the dashboard reserves its own pages; the owned claim is a project.page only
  const pages = [page('reports', 'reports', 'reports', 'studio.page')]
  expect(ids(selectAddonPages(pages, ['tasks', 'reports']))).toEqual([])
  expect(ids(selectAddonPages(pages, ['tasks']))).toEqual([])
})
