import { expect, test } from '@playwright/test'
import { provideHost } from '../../addon/src/hostBridge'
import { pieceContext, runContribution } from '../../addon/src/pieces'
import type { AddonUser } from '../../addon/src/scopes'
import { shortcutEntities } from '../../shared/src/components/AddonLayout/useAddonTableShortcuts'

// Every slot's code gets `user`, added where pieces are called and rendered (pieceContext, used by
// runContribution and ContributionView), not per surface. ContributionView is .tsx, which the unit
// runner compiles as component-test JSX, so it is covered through pieceContext.

const user: AddonUser = {
  name: 'jane',
  fullName: 'Jane Doe',
  isAdmin: false,
  isManager: true,
  isGuest: false,
  isService: false,
  isDeveloper: false,
}
const addon = { name: 'my-addon', version: '1.0.0', remote: 'my_addon' }
const contribution = (slot: string, pieces: Record<string, unknown>) =>
  ({ slot, id: 'item', key: 'my-addon.item', label: 'Item', addon, ...pieces }) as never

test('pieces get the slot context with slot and user', () => {
  const tab = contribution('detailsPanel.tab', {})
  expect(pieceContext(tab, { projectName: 'p' }, user)).toEqual({
    projectName: 'p',
    slot: 'detailsPanel.tab',
    user,
  })
  expect(() => pieceContext(tab, {}, undefined)).toThrow('no signed-in user')
})

test('run pieces get the user the host provides', async () => {
  let received: unknown
  const run = () => Promise.resolve({ default: (context: unknown) => void (received = context) })
  provideHost({ getUser: () => user })
  await runContribution(contribution('entityMenuItem', { run }), {
    projectName: 'p',
    page: 'overview',
    entities: [],
  } as never)
  expect(received).toEqual({
    projectName: 'p',
    page: 'overview',
    entities: [],
    slot: 'entityMenuItem',
    user,
  })
})

test('table shortcuts have entities in the project tables only', () => {
  const rows = [
    { id: 'f1', entityType: 'folder', name: 'sh010', data: {} },
    { id: 'l1', entityType: 'version', label: 'Dailies', data: {} },
    { id: 'x', data: {} },
  ]
  expect(shortcutEntities('lists', 'p', rows)).toEqual([
    { id: 'f1', entityType: 'folder', projectName: 'p', name: 'sh010', label: undefined },
    { id: 'l1', entityType: 'version', projectName: 'p', name: undefined, label: 'Dailies' },
  ])
  // the lists panel's rows are lists, typed by their items
  expect(shortcutEntities('listsPanel', 'p', rows)).toEqual([])
  expect(shortcutEntities('projects', null, rows)).toEqual([])
})
