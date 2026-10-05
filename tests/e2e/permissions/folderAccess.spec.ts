import { assigned, expect, hierarchy, onlyFolders, test } from './restrictedUser'
import { AyonApi } from '../support/api'
import { OverviewPage } from '../pages/OverviewPage'
import { apiAs, signInAs } from '../support/session'
import { dialog, menuItem, toast } from '../support/ui'

/** Two shots: sh010 with comp and roto, sh020 with anim */
const createShots = async (api: AyonApi, projectName: string, compAssignees: string[] = []) => {
  const sh010 = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
  const sh020 = await api.createFolder(projectName, { name: 'sh020', folderType: 'Shot' })
  const comp = await api.createTask(projectName, {
    folderId: sh010.id,
    name: 'comp',
    taskType: 'Compositing',
    assignees: compAssignees,
  })
  const roto = await api.createTask(projectName, {
    folderId: sh010.id,
    name: 'roto',
    taskType: 'Roto',
  })
  const anim = await api.createTask(projectName, {
    folderId: sh020.id,
    name: 'anim',
    taskType: 'Animation',
  })
  return { sh010, sh020, comp, roto, anim }
}

test.describe('permissions: folder access', () => {
  test('read access limited to assigned tasks hides the other folders', async ({
    api,
    projectName,
    restrictedUser,
    browser,
  }, testInfo) => {
    // assignees must hold a license seat
    const user = await restrictedUser({ read: onlyFolders(assigned()) }, { licensed: true })
    const { sh010, sh020 } = await createShots(api, projectName, [user.name])
    const { context, page } = await signInAs(browser, user.name, user.password)
    const userApi = await apiAs(testInfo, user.name, user.password)
    try {
      const overview = new OverviewPage(page)
      await overview.goto(projectName)
      await expect(overview.row('sh010')).toBeVisible()
      // all folders come in one response, so sh020 would be there by now
      await expect(overview.row('sh020')).toHaveCount(0)
      await overview.expand('sh010')
      await expect(overview.row('comp')).toBeVisible()
      // tasks next to an assigned task are shown by default ("Show sibling tasks")
      await expect(overview.row('roto')).toBeVisible()
      await expect(overview.row('anim')).toHaveCount(0)

      expect((await userApi.getFolder(projectName, sh010.id)).name).toBe('sh010')
      await expect(userApi.getFolder(projectName, sh020.id)).rejects.toThrow(/failed with 403/)
    } finally {
      await userApi.dispose()
      await context.close()
    }
  })

  test('without "Show sibling tasks" only the assigned task is shown', async ({
    api,
    projectName,
    restrictedUser,
    browser,
  }, testInfo) => {
    const user = await restrictedUser(
      { read: onlyFolders(assigned()), advanced: { show_sibling_tasks: false } },
      { licensed: true },
    )
    const { sh010 } = await createShots(api, projectName, [user.name])
    const { context, page } = await signInAs(browser, user.name, user.password)
    const userApi = await apiAs(testInfo, user.name, user.password)
    try {
      const overview = new OverviewPage(page)
      await overview.goto(projectName)
      await overview.expand('sh010')
      await expect(overview.row('comp')).toBeVisible()
      // the tasks of a folder come in one response
      await expect(overview.row('roto')).toHaveCount(0)

      expect((await userApi.listTasks(projectName, sh010.id)).map((t) => t.name)).toEqual(['comp'])
    } finally {
      await userApi.dispose()
      await context.close()
    }
  })

  // FLAG (backend): "Show sibling tasks" off is only applied when tasks are listed through GraphQL
  // (ayon-backend ayon_server/graphql/resolvers/tasks.py). `GET /api/projects/{project}/tasks/{id}`
  // checks access with `ensure_entity_access`, which only matches the folder path, so a hidden
  // sibling task is still readable (and its id is enough). Not reachable through the UI, which
  // reads tasks through GraphQL.
  test.fixme(
    'a hidden sibling task cannot be read by its id either',
    async ({ api, projectName, restrictedUser }, testInfo) => {
      const user = await restrictedUser(
        { read: onlyFolders(assigned()), advanced: { show_sibling_tasks: false } },
        { licensed: true },
      )
      const { roto } = await createShots(api, projectName, [user.name])
      const userApi = await apiAs(testInfo, user.name, user.password)
      try {
        await expect(userApi.getTask(projectName, roto.id)).rejects.toThrow(/failed with 403/)
      } finally {
        await userApi.dispose()
      }
    },
  )

  test('creating outside the allowed folders is rejected', async ({
    api,
    projectName,
    restrictedUser,
    browser,
  }) => {
    const user = await restrictedUser({ create: onlyFolders(hierarchy('sh010')) })
    const { sh010, sh020 } = await createShots(api, projectName)
    const { context, page } = await signInAs(browser, user.name, user.password)
    try {
      const overview = new OverviewPage(page)
      await overview.goto(projectName)
      const createDialog = overview.createDialog()

      // a root folder: nothing selected
      await overview.openCreate('folder')
      await expect(dialog(page, 'Add New Root Folder')).toBeVisible()
      await createDialog.getByLabel('Label', { exact: true }).fill('rootf')
      await createDialog.getByRole('button', { name: 'Create folder' }).click()
      await expect(toast(page, 'You are not allowed to create folder rootf')).toBeVisible()
      // the dialog stays open so the input is not lost
      await expect(createDialog).toBeVisible()
      await createDialog.getByRole('button', { name: 'close', exact: true }).click()
      await expect(createDialog).toBeHidden()

      // a task in sh020
      await overview.selectRow('sh020')
      await overview.openCreate('task')
      await createDialog.getByLabel('Label', { exact: true }).fill('newtask')
      await createDialog.getByRole('button', { name: 'Create task' }).click()
      await expect(toast(page, /Access denied for folder/)).toBeVisible()
      await createDialog.getByRole('button', { name: 'close', exact: true }).click()
      await expect(createDialog).toBeHidden()

      // a task in sh010 is allowed
      await overview.selectRow('sh010')
      await overview.createTask({ label: 'oktask' })
      await overview.expand('sh010')
      await expect(overview.row('oktask')).toBeVisible()

      await expect
        .poll(async () => (await api.listTasks(projectName, sh010.id)).map((t) => t.name).sort())
        .toEqual(['comp', 'oktask', 'roto'])
      expect((await api.listTasks(projectName, sh020.id)).map((t) => t.name)).toEqual(['anim'])
      expect((await api.listFolders(projectName)).map((f) => f.name).sort()).toEqual([
        'sh010',
        'sh020',
      ])
    } finally {
      await context.close()
    }
  })

  test('changing a task outside the allowed folders is rejected and reverted', async ({
    api,
    projectName,
    restrictedUser,
    browser,
  }) => {
    const user = await restrictedUser({ update: onlyFolders(hierarchy('sh010')) })
    const { comp, anim } = await createShots(api, projectName)
    const { context, page } = await signInAs(browser, user.name, user.password)
    try {
      const overview = new OverviewPage(page)
      await overview.goto(projectName)
      await overview.expand('sh010')
      await overview.expand('sh020')

      await overview.setEnumCell('anim', 'status', 'In progress')

      await expect(toast(page, 'Failed to update task: anim')).toBeVisible()
      await expect(overview.cell('anim', 'status')).toContainText('Not ready')

      // the same change in sh010 is allowed
      await overview.setEnumCell('comp', 'status', 'In progress')
      await expect(overview.cell('comp', 'status')).toContainText('In progress')
      await expect
        .poll(async () => (await api.getTask(projectName, comp.id)).status)
        .toBe('In progress')
      expect((await api.getTask(projectName, anim.id)).status).toBe('Not ready')
      await expect(overview.cell('anim', 'status')).toContainText('Not ready')
    } finally {
      await context.close()
    }
  })

  test('deleting a task outside the allowed folders is rejected', async ({
    api,
    projectName,
    restrictedUser,
    browser,
  }) => {
    const user = await restrictedUser({ delete: onlyFolders(hierarchy('sh010')) })
    const { sh010, anim } = await createShots(api, projectName)
    const { context, page } = await signInAs(browser, user.name, user.password)
    try {
      const overview = new OverviewPage(page)
      await overview.goto(projectName)
      await overview.expand('sh010')
      await overview.expand('sh020')

      await overview.selectRow('anim')
      await overview.nameCell('anim').click({ button: 'right' })
      await menuItem(page, 'Delete').click()
      const confirm = dialog(page, /^Delete forever/)
      await confirm.getByTestId('delete-confirm-name-input').fill('anim')
      await confirm.getByTestId('delete-confirm-submit').click()

      await expect(toast(page, /Access denied for task/)).toBeVisible()
      await expect(overview.row('anim')).toBeVisible()

      // deleting in sh010 is allowed
      await overview.deleteRow('roto')
      await expect(overview.row('roto')).toBeHidden()
      await expect
        .poll(async () => (await api.listTasks(projectName, sh010.id)).map((t) => t.name))
        .toEqual(['comp'])
      expect((await api.getTask(projectName, anim.id)).name).toBe('anim')
      await expect(overview.row('anim')).toBeVisible()
    } finally {
      await context.close()
    }
  })
})
