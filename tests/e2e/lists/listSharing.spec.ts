import { expect, test } from '../fixtures'
import { addToList, hasPowerpack, ListsPage } from '../pages/ListsPage'
import { OverviewPage } from '../pages/OverviewPage'
import { AyonApi } from '../support/api'
import { apiAs, signInAs } from '../support/session'
import { dialog, menuItem } from '../support/ui'

const seedList = async (api: AyonApi, projectName: string) => {
  const shot = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
  const comp = await api.createTask(projectName, { folderId: shot.id, name: 'comp' })
  const anim = await api.createTask(projectName, { folderId: shot.id, name: 'anim' })
  const listId = await api.createEntityList(projectName, { label: 'Client picks' })
  await api.addEntityListItem(projectName, listId, comp.id)
  await api.addEntityListItem(projectName, listId, anim.id)
  return { listId, comp, anim }
}

test.describe('list sharing', () => {
  test.beforeEach(async ({ api }) => {
    test.skip(!(await hasPowerpack(api)), 'list sharing needs the powerpack addon')
  })

  test('share a list with one user only', async ({
    page,
    api,
    projectName,
    createUser,
    accessGroup,
  }) => {
    // only licensed users with access to the project are offered in the share form
    const user = await createUser({
      licensed: true,
      accessGroups: { [projectName]: [accessGroup] },
    })
    const listId = await api.createEntityList(projectName, { label: 'Client picks' })
    const lists = new ListsPage(page)
    await lists.goto(projectName)
    await lists.openDetails('Client picks')
    await lists.detailsTab('Share')

    await lists.setAccessLevel('Everyone', 'No access')
    await lists.addAccess(user.name, user.name)
    await lists.saveAccess()

    await expect
      .poll(async () => (await api.getEntityList(projectName, listId)).access)
      .toEqual({ __everyone__: 0, [`user:${user.name}`]: 10 })
  })

  test('a list shared with nobody is hidden from other users', async ({
    browser,
    api,
    projectName,
    createUser,
    accessGroup,
  }, testInfo) => {
    const user = await createUser({ accessGroups: { [projectName]: [accessGroup] } })
    await api.createEntityList(projectName, { label: 'Team picks' })
    const privateId = await api.createEntityList(projectName, { label: 'Supervisor notes' })
    await api.updateEntityList(projectName, privateId, { access: { __everyone__: 0 } })

    const { context, page } = await signInAs(browser, user.name, user.password)
    try {
      const lists = new ListsPage(page)
      await lists.goto(projectName)
      await expect(lists.listRow('Team picks')).toBeVisible()
      await expect(lists.listRow('Supervisor notes')).toBeHidden()
    } finally {
      await context.close()
    }
    const userApi = await apiAs(testInfo, user.name, user.password)
    try {
      expect((await userApi.listEntityLists(projectName)).map((l) => l.label)).toEqual([
        'Team picks',
      ])
    } finally {
      await userApi.dispose()
    }
  })

  test('a viewer sees the items of a shared list but cannot remove them', async ({
    browser,
    api,
    projectName,
    createUser,
    accessGroup,
  }, testInfo) => {
    const user = await createUser({ accessGroups: { [projectName]: [accessGroup] } })
    const { listId, comp } = await seedList(api, projectName)
    await api.updateEntityList(projectName, listId, {
      access: { __everyone__: 0, [`user:${user.name}`]: 10 },
    })

    const { context, page } = await signInAs(browser, user.name, user.password)
    try {
      const lists = new ListsPage(page)
      await lists.goto(projectName)
      await lists.openList('Client picks')
      await expect(lists.itemNameCell('comp')).toBeVisible()
      await expect(lists.itemNameCell('anim')).toBeVisible()

      await lists.itemNameCell('comp').click()
      await expect(lists.itemNameCell('comp')).toHaveClass(/selected/)

      await expect(lists.removeItemsButton).toBeDisabled()
      await expect(lists.itemsTable.getByTitle('Drag to reorder')).toHaveCount(0)
    } finally {
      await context.close()
    }
    const userApi = await apiAs(testInfo, user.name, user.password)
    try {
      const { items } = await api.getEntityList(projectName, listId)
      const itemId = items.find((i) => i.entityId === comp.id)!.id
      const res = await userApi.request.delete(
        `/api/projects/${projectName}/lists/${listId}/items/${itemId}`,
      )
      expect(res.status()).toBe(403)
    } finally {
      await userApi.dispose()
    }
  })

  test('lists a user can only view are not offered when adding to a list', async ({
    browser,
    api,
    projectName,
    createUser,
    accessGroup,
  }) => {
    const user = await createUser({ accessGroups: { [projectName]: [accessGroup] } })
    const shot = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    const comp = await api.createTask(projectName, { folderId: shot.id, name: 'comp' })
    const viewOnlyId = await api.createEntityList(projectName, { label: 'Client picks' })
    await api.updateEntityList(projectName, viewOnlyId, {
      access: { __everyone__: 0, [`user:${user.name}`]: 10 },
    })
    const openId = await api.createEntityList(projectName, { label: 'Team picks' })

    const { context, page } = await signInAs(browser, user.name, user.password)
    try {
      const overview = new OverviewPage(page)
      await overview.goto(projectName)
      await overview.expand('sh010')
      await overview.selectRow('comp')
      await overview.nameCell('comp').click({ button: 'right' })
      await menuItem(page, 'Add to list').click()

      const addDialog = dialog(page, 'Add to list')
      await expect(addDialog.getByRole('row').filter({ hasText: 'Team picks' })).toBeVisible()
      await expect(addDialog.getByRole('row').filter({ hasText: 'Client picks' })).toBeHidden()
      await addToList(page, 'Team picks')
    } finally {
      await context.close()
    }
    await expect
      .poll(async () => (await api.getEntityList(projectName, openId)).items.map((i) => i.entityId))
      .toEqual([comp.id])
    expect((await api.getEntityList(projectName, viewOnlyId)).items).toEqual([])
  })

  test('an editor of a shared list can remove its items', async ({
    browser,
    api,
    projectName,
    createUser,
    accessGroup,
  }) => {
    const user = await createUser({ accessGroups: { [projectName]: [accessGroup] } })
    const { listId, anim } = await seedList(api, projectName)
    await api.updateEntityList(projectName, listId, {
      access: { __everyone__: 0, [`user:${user.name}`]: 20 },
    })

    const { context, page } = await signInAs(browser, user.name, user.password)
    try {
      const lists = new ListsPage(page)
      await lists.goto(projectName)
      await lists.openList('Client picks')
      await expect(lists.itemNameCell('comp')).toBeVisible()

      await lists.removeItem('comp')

      await expect(lists.itemNameCell('comp')).toBeHidden()
    } finally {
      await context.close()
    }
    await expect
      .poll(async () => (await api.getEntityList(projectName, listId)).items.map((i) => i.entityId))
      .toEqual([anim.id])
  })

  // FLAG (backend bug): editors via a shared access group or team get 403 on every list change
  // fixed in ynput/ayon-backend#1172, switch back to test() once it is merged
  test.fixme(
    'members of an access group a list is shared with as editors can remove its items',
    async ({ browser, api, projectName, createUser, accessGroup }) => {
      const user = await createUser({ accessGroups: { [projectName]: [accessGroup] } })
      const { listId, anim } = await seedList(api, projectName)
      await api.updateEntityList(projectName, listId, {
        access: { __everyone__: 0, [`group:${accessGroup}`]: 20 },
      })

      const { context, page } = await signInAs(browser, user.name, user.password)
      try {
        const lists = new ListsPage(page)
        await lists.goto(projectName)
        await lists.openList('Client picks')
        await expect(lists.itemNameCell('comp')).toBeVisible()

        await lists.removeItem('comp')

        await expect(lists.itemNameCell('comp')).toBeHidden()
      } finally {
        await context.close()
      }
      await expect
        .poll(async () =>
          (await api.getEntityList(projectName, listId)).items.map((i) => i.entityId),
        )
        .toEqual([anim.id])
    },
  )
})
