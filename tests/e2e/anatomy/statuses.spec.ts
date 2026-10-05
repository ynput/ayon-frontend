import { expect, test } from '../fixtures'
import { AyonApi } from '../support/api'
import { toast } from '../support/ui'
import { OverviewPage } from '../pages/OverviewPage'
import { ProjectsManagerPage } from '../pages/ProjectsManagerPage'
import { TasksProgressPage } from '../pages/TasksProgressPage'

// Every test changes the anatomy of its own project only (the `projectName` fixture).

/** A status that is not in the default anatomy */
const WAITING = {
  name: 'Waiting for client',
  shortName: 'WFC',
  state: 'blocked',
  icon: 'hourglass_top',
  color: '#8a2be2',
  scope: ['folder', 'task'],
}
/** WAITING.color as the browser reports it */
const WAITING_RGB = 'rgb(138, 43, 226)'

const ALL_SCOPES = ['folder', 'product', 'version', 'representation', 'task', 'workfile']

/** Append a status to the project anatomy */
const addStatus = (api: AyonApi, projectName: string, status: Record<string, unknown>) =>
  api.updateProjectAnatomy(projectName, (anatomy) => ({
    ...anatomy,
    statuses: [...anatomy.statuses, status],
  }))

/** Folder sh010 with the task anim */
const seedShot = async (api: AyonApi, projectName: string, taskStatus?: string) => {
  const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
  const task = await api.createTask(projectName, {
    folderId: folder.id,
    name: 'anim',
    taskType: 'Animation',
    ...(taskStatus ? { status: taskStatus } : {}),
  })
  return { folder, task }
}

const statusNames = async (api: AyonApi, projectName: string): Promise<string[]> =>
  (await api.getProject(projectName)).statuses.map((s: { name: string }) => s.name)

/** Opens the project anatomy with the "Statuses" section expanded */
const openStatuses = async (manager: ProjectsManagerPage, projectName: string) => {
  await manager.goto('anatomy', projectName)
  await manager.anatomy.expand('Statuses')
  await expect(manager.anatomy.textbox('root_statuses_0_name')).toBeVisible()
}

test.describe('project anatomy: statuses', () => {
  test('add a status with a short name, state, icon, color and scope', async ({
    page,
    api,
    projectName,
  }) => {
    const index = (await statusNames(api, projectName)).length
    const item = `root_statuses_${index}`
    const manager = new ProjectsManagerPage(page)
    await openStatuses(manager, projectName)

    await manager.anatomy.addItem('root_statuses')
    await manager.anatomy.fillText(`${item}_name`, WAITING.name)
    await manager.anatomy.fillText(`${item}_shortName`, WAITING.shortName)
    await manager.anatomy.select(`${item}_state`, WAITING.state)
    await manager.anatomy.pickIcon(`${item}_icon`, WAITING.icon)
    await manager.anatomy.setColor(`${item}_color`, WAITING.color)
    await manager.anatomy.setOptions(`${item}_scope`, ...WAITING.scope)
    await manager.saveAnatomy()

    await expect
      .poll(async () => (await api.getProject(projectName)).statuses[index])
      .toMatchObject(WAITING)
    // the saved status is shown after a reload
    await openStatuses(manager, projectName)
    await expect(manager.anatomy.textbox(`${item}_name`)).toHaveValue(WAITING.name)
    await expect(manager.anatomy.dropdownButton(`${item}_icon`)).toContainText(WAITING.icon)
    await expect(manager.anatomy.dropdownButton(`${item}_scope`)).toHaveText(/^Folder\s*Task/)
  })

  test('a status added in the anatomy is offered in an overview that was already open', async ({
    page,
    api,
    projectName,
  }) => {
    const { task } = await seedShot(api, projectName)
    const index = (await statusNames(api, projectName)).length
    const manager = new ProjectsManagerPage(page)
    await openStatuses(manager, projectName)
    // open the project and go back, all without reloading the app: the overview has loaded the
    // project with its statuses
    await manager.openProject(projectName)
    const overview = new OverviewPage(page)
    await expect(overview.table).toBeVisible({ timeout: 30_000 })
    await overview.expand('sh010')
    await expect(overview.cell('anim', 'status')).toBeVisible()
    await page.goBack()
    await expect(manager.anatomy.textbox('root_statuses_0_name')).toBeVisible()

    await manager.anatomy.addItem('root_statuses')
    await manager.anatomy.fillText(`root_statuses_${index}_name`, WAITING.name)
    await manager.anatomy.setOptions(`root_statuses_${index}_scope`, 'task')
    await manager.saveAnatomy()
    await page.goForward()

    await expect(overview.table).toBeVisible()
    await overview.expand('sh010')
    await overview.setEnumCell('anim', 'status', WAITING.name)
    await expect(overview.cell('anim', 'status')).toContainText(WAITING.name)
    await expect
      .poll(async () => (await api.getTask(projectName, task.id)).status)
      .toBe(WAITING.name)
  })

  test('a new status is offered in the overview, with its icon and color', async ({
    page,
    api,
    projectName,
  }) => {
    await addStatus(api, projectName, WAITING)
    const { task } = await seedShot(api, projectName)
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.expand('sh010')

    await overview.setEnumCell('anim', 'status', WAITING.name)

    const cell = overview.cell('anim', 'status')
    await expect(cell.getByText(WAITING.name)).toHaveCSS('color', WAITING_RGB)
    await expect(cell.getByText(WAITING.icon)).toHaveCSS('color', WAITING_RGB)
    await expect
      .poll(async () => (await api.getTask(projectName, task.id)).status)
      .toBe(WAITING.name)
  })

  test('a new status is offered in task progress, with its color', async ({
    page,
    api,
    projectName,
  }) => {
    await addStatus(api, projectName, WAITING)
    const { task } = await seedShot(api, projectName)
    const progress = new TasksProgressPage(page)
    await progress.goto(projectName)
    await progress.selectFolder('sh010')

    await progress.setStatus('sh010', 'anim', WAITING.name)

    // FLAG: task cards are colored with their status color, the card has no role or name
    await expect(progress.taskCell('sh010', 'anim').locator('.entity-card')).toHaveCSS(
      'background-color',
      WAITING_RGB,
    )
    await expect
      .poll(async () => (await api.getTask(projectName, task.id)).status)
      .toBe(WAITING.name)
  })

  test('a status limited to folders is offered for folders but not for tasks', async ({
    page,
    api,
    projectName,
  }) => {
    await addStatus(api, projectName, { ...WAITING, scope: ['folder'] })
    const { folder } = await seedShot(api, projectName)
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.expand('sh010')

    await overview.cell('anim', 'status').dblclick()
    // the task's statuses have loaded
    await expect(page.locator('.options [data-value="In progress"]')).toBeVisible()
    await expect(page.locator(`.options [data-value="${WAITING.name}"]`)).toHaveCount(0)
    // close the dropdown without picking anything
    await overview.nameCell('anim').click()
    await expect(page.locator('.options')).toBeHidden()

    await overview.setEnumCell('sh010', 'status', WAITING.name)

    await expect(overview.cell('sh010', 'status')).toContainText(WAITING.name)
    await expect
      .poll(async () => (await api.getFolder(projectName, folder.id)).status)
      .toBe(WAITING.name)
  })

  // FLAG (app bug): a status added in the anatomy editor is saved with `scope: []` unless a scope is
  // picked, and the app offers a status with an empty scope nowhere. The schema has no default for
  // `Status.scope` (the backend's default_factory, every entity type, is not part of the JSON
  // schema), so SelectWidget starts the empty multiselect at [] and reports it through onChange.
  // The API alone (scope left out) stores every entity type.
  test.fixme(
    'a status added without a scope can be used on tasks',
    async ({ page, api, projectName }) => {
      const index = (await statusNames(api, projectName)).length
      await seedShot(api, projectName)
      const manager = new ProjectsManagerPage(page)
      await openStatuses(manager, projectName)

      await manager.anatomy.addItem('root_statuses')
      await manager.anatomy.fillText(`root_statuses_${index}_name`, WAITING.name)
      await manager.saveAnatomy()

      await expect
        .poll(async () => (await api.getProject(projectName)).statuses[index])
        .toMatchObject({ name: WAITING.name, scope: ALL_SCOPES })
      const overview = new OverviewPage(page)
      await overview.goto(projectName)
      await overview.expand('sh010')
      await overview.setEnumCell('anim', 'status', WAITING.name)
      await expect(overview.cell('anim', 'status')).toContainText(WAITING.name)
    },
  )

  test('renaming a status renames it on the tasks that have it', async ({
    page,
    api,
    projectName,
  }) => {
    const { task } = await seedShot(api, projectName, 'In progress')
    const index = (await statusNames(api, projectName)).indexOf('In progress')
    const manager = new ProjectsManagerPage(page)
    await openStatuses(manager, projectName)

    await manager.anatomy.fillText(`root_statuses_${index}_name`, 'Working')
    await manager.saveAnatomy()

    await expect.poll(() => statusNames(api, projectName)).toContain('Working')
    const names = await statusNames(api, projectName)
    expect(names.indexOf('Working')).toBe(index)
    expect(names).not.toContain('In progress')
    expect((await api.getTask(projectName, task.id)).status).toBe('Working')
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.expand('sh010')
    await expect(overview.cell('anim', 'status')).toContainText('Working')
  })

  test('a status that tasks still have cannot be removed', async ({ page, api, projectName }) => {
    const { task } = await seedShot(api, projectName, 'On hold')
    const before = await statusNames(api, projectName)
    const manager = new ProjectsManagerPage(page)
    await openStatuses(manager, projectName)

    await manager.anatomy.removeItem('root_statuses', before.indexOf('On hold'))
    await expect(manager.anatomy.textbox(`root_statuses_${before.length - 1}_name`)).toBeHidden()
    await page.getByRole('button', { name: 'Save changes' }).click()

    // the server refuses the whole anatomy and says why
    const error = toast(page, 'Failed to save anatomy')
    await expect(error).toBeVisible()
    await expect(error).toContainText("'On hold' is still referenced")
    expect(await statusNames(api, projectName)).toEqual(before)
    expect((await api.getTask(projectName, task.id)).status).toBe('On hold')
  })

  test('reordering statuses changes their order in the status dropdown', async ({
    page,
    api,
    projectName,
  }) => {
    const { task } = await seedShot(api, projectName)
    const current = (await api.getTask(projectName, task.id)).status
    const before = await statusNames(api, projectName)
    const last = before[before.length - 1]
    const manager = new ProjectsManagerPage(page)
    await openStatuses(manager, projectName)

    await manager.anatomy.moveItem('root_statuses', before.length - 1, 0)
    await expect(manager.anatomy.textbox('root_statuses_0_name')).toHaveValue(last)
    await manager.saveAnatomy()

    await expect.poll(() => statusNames(api, projectName)).toEqual([last, ...before.slice(0, -1)])
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.expand('sh010')
    await overview.cell('anim', 'status').dblclick()
    // the task's statuses in anatomy order (statuses not meant for tasks are left out); the
    // dropdown may list the task's current status first, so it is left out of the comparison
    const taskStatuses = (await api.getProject(projectName)).statuses
      .filter((s: { scope: string[] }) => s.scope.includes('task'))
      .map((s: { name: string }) => s.name)
    const options = page.locator('.options [data-value]')
    await expect(options).toHaveCount(taskStatuses.length)
    const shown = await options.evaluateAll((items) =>
      items.map((i) => i.getAttribute('data-value')),
    )
    expect(shown.filter((name) => name !== current)).toEqual(
      taskStatuses.filter((name: string) => name !== current),
    )
  })
})
