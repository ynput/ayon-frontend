import { expect, test } from '@playwright/test'
import { entityUrl, navigateToEntity } from '../../addon/src/entityLinks'
import { provideHost } from '../../addon/src/hostBridge'

const id = 'b'.repeat(32)
const ref = (entityType: string) => ({ projectName: 'demo', entityType, id })

test('folders and tasks open on the overview', () => {
  for (const entityType of ['folder', 'task']) {
    expect(entityUrl(ref(entityType))).toBe(
      `/projects/demo/overview?project=demo&type=${entityType}&id=${id}`,
    )
  }
})

test('products, versions and representations open on the products page', () => {
  for (const entityType of ['product', 'version', 'representation']) {
    expect(entityUrl(ref(entityType))).toBe(
      `/projects/demo/products?project=demo&type=${entityType}&id=${id}`,
    )
  }
})

test('an activity is highlighted in the feed', () => {
  expect(entityUrl(ref('version'), { activity: 'a'.repeat(32) })).toBe(
    `/projects/demo/products?project=demo&type=version&id=${id}&activity=${'a'.repeat(32)}`,
  )
})

test('entity types without a page, or refs missing a field, have no link', () => {
  expect(entityUrl(ref('workfile'))).toBeUndefined()
  expect(entityUrl({ projectName: '', entityType: 'task', id })).toBeUndefined()
  expect(entityUrl({ projectName: 'demo', entityType: 'task', id: '' })).toBeUndefined()
})

test('slot context entities work as they are', () => {
  const entity = { id, entityType: 'task', projectName: 'demo', name: 'compositing', label: 'Comp' }
  expect(entityUrl(entity)).toBe(`/projects/demo/overview?project=demo&type=task&id=${id}`)
})

test("navigateToEntity goes through the host's router", () => {
  const visited: string[] = []
  provideHost({ navigate: (to) => visited.push(to) })
  expect(navigateToEntity(ref('task'))).toBe(true)
  expect(navigateToEntity(ref('workfile'))).toBe(false)
  expect(visited).toEqual([`/projects/demo/overview?project=demo&type=task&id=${id}`])
})
