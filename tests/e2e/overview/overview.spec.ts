import { expect, test } from '../fixtures'
import { OverviewPage } from '../pages/OverviewPage'

test.describe('project overview', () => {
  test('create a root folder', async ({ page, api, projectName }) => {
    const overview = new OverviewPage(page)
    await overview.goto(projectName)

    await overview.createFolder({ label: 'Hero Assets', type: 'Asset' })

    await expect(overview.row('Hero Assets')).toBeVisible()
    await expect
      .poll(async () =>
        (await api.listFolders(projectName)).map((f) => [f.label ?? f.name, f.folderType]),
      )
      .toEqual([['Hero Assets', 'Asset']])
  })

  test('create a child folder inside the selected folder', async ({ page, api, projectName }) => {
    const parent = await api.createFolder(projectName, { name: 'sq010', folderType: 'Sequence' })
    const overview = new OverviewPage(page)
    await overview.goto(projectName)

    await overview.selectRow('sq010')
    await overview.createFolder({ label: 'sh010', type: 'Shot' })

    await expect(overview.row('sh010')).toBeVisible()
    await expect
      .poll(async () => (await api.listFolders(projectName)).find((f) => f.name === 'sh010'))
      .toMatchObject({ parentId: parent.id, folderType: 'Shot' })
  })

  test('create a task in the selected folder', async ({ page, api, projectName }) => {
    const folder = await api.createFolder(projectName, { name: 'sh020', folderType: 'Shot' })
    const overview = new OverviewPage(page)
    await overview.goto(projectName)

    await overview.selectRow('sh020')
    await overview.createTask({ label: 'comp', type: 'Compositing' })

    await overview.expand('sh020')
    await expect(overview.row('comp')).toBeVisible()
    await expect
      .poll(async () =>
        (await api.listTasks(projectName, folder.id)).map((t) => [t.name, t.taskType]),
      )
      .toEqual([['comp', 'Compositing']])
  })

  test('create a numbered sequence of folders', async ({ page, api, projectName }) => {
    const parent = await api.createFolder(projectName, { name: 'sq020', folderType: 'Sequence' })
    const overview = new OverviewPage(page)
    await overview.goto(projectName)

    await overview.selectRow('sq020')
    await overview.createFolderSequence({ type: 'Shot', first: 'sh010', count: 3 })

    await overview.expand('sq020')
    for (const name of ['sh010', 'sh020', 'sh030']) {
      await expect(overview.row(name)).toBeVisible()
    }
    await expect
      .poll(async () =>
        (
          await api.listFolders(projectName)
        )
          .filter((f) => f.parentId === parent.id)
          .map((f) => [f.name, f.folderType])
          .sort(),
      )
      .toEqual([
        ['sh010', 'Shot'],
        ['sh020', 'Shot'],
        ['sh030', 'Shot'],
      ])
  })

  test('rename a folder', async ({ page, api, projectName }) => {
    const folder = await api.createFolder(projectName, { name: 'old_name' })
    const overview = new OverviewPage(page)
    await overview.goto(projectName)

    await overview.rename('old_name', 'New Label')

    await expect(overview.row('New Label')).toBeVisible()
    await expect
      .poll(async () => (await api.getFolder(projectName, folder.id)).label)
      .toBe('New Label')
  })

  test('change a task status from the table', async ({ page, api, projectName }) => {
    const folder = await api.createFolder(projectName, { name: 'sh030', folderType: 'Shot' })
    const task = await api.createTask(projectName, {
      folderId: folder.id,
      name: 'anim',
      taskType: 'Animation',
    })
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.expand('sh030')

    await overview.setEnumCell('anim', 'status', 'In progress')

    await expect(overview.cell('anim', 'status')).toContainText('In progress')
    await expect
      .poll(async () => (await api.getTask(projectName, task.id)).status)
      .toBe('In progress')
  })

  test('delete a folder', async ({ page, api, projectName }) => {
    await api.createFolder(projectName, { name: 'keep_me' })
    const doomed = await api.createFolder(projectName, { name: 'delete_me' })
    const overview = new OverviewPage(page)
    await overview.goto(projectName)

    await overview.deleteRow('delete_me')

    await expect(overview.row('delete_me')).toBeHidden()
    await expect(overview.row('keep_me')).toBeVisible()
    await expect
      .poll(async () => (await api.listFolders(projectName)).map((f) => f.id))
      .not.toContain(doomed.id)
  })
})

test.describe('project overview editing', () => {
  test('assign a user to a task', async ({ page, api, projectName, createUser, accessGroup }) => {
    const fullName = `Assignee${Math.random().toString(36).slice(2, 7)}`
    // only licensed users with access to the project are offered as assignees
    const artist = await createUser({
      fullName,
      licensed: true,
      accessGroups: { [projectName]: [accessGroup] },
    })
    const folder = await api.createFolder(projectName, { name: 'sh040', folderType: 'Shot' })
    const task = await api.createTask(projectName, {
      folderId: folder.id,
      name: 'fx',
      taskType: 'FX',
    })
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.expand('sh040')

    await overview.cell('fx', 'assignees').dblclick()
    await page.locator('.options').getByText(fullName, { exact: true }).click()
    await page.keyboard.press('Escape')

    await expect(overview.cell('fx', 'assignees')).toContainText(fullName)
    await expect
      .poll(async () => (await api.getTask(projectName, task.id)).assignees)
      .toEqual([artist.name])
  })

  test('undo a rename', async ({ page, api, projectName }) => {
    const folder = await api.createFolder(projectName, { name: 'original' })
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.rename('original', 'Renamed')
    await expect
      .poll(async () => (await api.getFolder(projectName, folder.id)).label)
      .toBe('Renamed')

    await expect
      .poll(async () => (await api.getFolder(projectName, folder.id)).name)
      .toBe('renamed')

    // one undo reverts the whole rename (name and label)
    await page.getByRole('button', { name: 'undo', exact: true }).click()

    await expect(overview.row('original')).toBeVisible()
    await expect
      .poll(async () => {
        const { name, label } = await api.getFolder(projectName, folder.id)
        return { name, label: label ?? null }
      })
      .toEqual({ name: 'original', label: null })
  })

  test('search narrows the table to matching rows', async ({ page, api, projectName }) => {
    await api.createFolder(projectName, { name: 'forest_env', folderType: 'Asset' })
    await api.createFolder(projectName, { name: 'castle_env', folderType: 'Asset' })
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await expect(overview.row('castle_env')).toBeVisible()

    const search = page.getByPlaceholder('Search and filter')
    await search.click()
    await page.keyboard.type('forest')
    await page.keyboard.press('Enter')

    await expect(overview.row('forest_env')).toBeVisible()
    await expect(overview.row('castle_env')).toBeHidden()
  })
})
