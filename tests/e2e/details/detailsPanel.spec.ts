import { Page } from '@playwright/test'
import { expect, test } from '../fixtures'
import { AyonApi } from '../support/api'
import { OverviewPage } from '../pages/OverviewPage'

/** A shot with one task */
const setup = async (api: AyonApi, projectName: string) => {
  const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
  const task = await api.createTask(projectName, {
    folderId: folder.id,
    name: 'layout',
    taskType: 'Layout',
  })
  return { folder, task }
}

/** Open the task in the overview details panel */
const openTask = async (page: Page, projectName: string) => {
  const overview = new OverviewPage(page)
  await overview.goto(projectName)
  await overview.expand('sh010')
  const panel = await overview.openDetails('layout')
  return { overview, panel }
}

test.describe('details panel', () => {
  test('change the priority', async ({ page, api, projectName }) => {
    const { task } = await setup(api, projectName)
    const { overview, panel } = await openTask(page, projectName)

    await panel.setPriority('urgent', 'Urgent')

    await expect(overview.cell('layout', 'attrib_priority')).toContainText('Urgent')
    await expect
      .poll(async () => (await api.getTask(projectName, task.id)).attrib.priority)
      .toBe('urgent')
  })

  test('assign a user', async ({ page, api, projectName, createUser, accessGroup }) => {
    const fullName = `Panel${Math.random().toString(36).slice(2, 7)}`
    // only licensed users with access to the project are offered as assignees
    const artist = await createUser({
      fullName,
      licensed: true,
      accessGroups: { [projectName]: [accessGroup] },
    })
    const { task } = await setup(api, projectName)
    const { overview, panel } = await openTask(page, projectName)

    await panel.toggleAssignees(artist.name)

    await expect(panel.assigneeSelect).not.toContainText('Assign user')
    await expect(overview.cell('layout', 'assignees')).toContainText(fullName)
    await expect
      .poll(async () => (await api.getTask(projectName, task.id)).assignees)
      .toEqual([artist.name])
  })

  test('unassign a user', async ({ page, api, projectName, createUser, accessGroup }) => {
    const artist = await createUser({
      licensed: true,
      accessGroups: { [projectName]: [accessGroup] },
    })
    const { task } = await setup(api, projectName)
    await api.updateTask(projectName, task.id, { assignees: [artist.name] })
    const { overview, panel } = await openTask(page, projectName)
    await expect(overview.cell('layout', 'assignees')).toContainText(artist.name)

    await panel.toggleAssignees(artist.name)

    await expect(panel.assigneeSelect).toContainText('Assign user')
    await expect(overview.cell('layout', 'assignees')).not.toContainText(artist.name)
    await expect.poll(async () => (await api.getTask(projectName, task.id)).assignees).toEqual([])
  })

  test('edit the description', async ({ page, api, projectName }) => {
    const { task } = await setup(api, projectName)
    const { panel } = await openTask(page, projectName)
    await panel.openTab('details')

    await panel.editDescription('Block out the camera moves')

    await expect(panel.description).toContainText('Block out the camera moves')
    await expect
      .poll(async () => (await api.getTask(projectName, task.id)).attrib.description)
      .toBe('Block out the camera moves')
  })

  test('edit an attribute', async ({ page, api, projectName }) => {
    const { task } = await setup(api, projectName)
    const { panel } = await openTask(page, projectName)
    await panel.openTab('details')

    await panel.setAttribute('Start frame', '1009')

    await expect(panel.attribute('Start frame')).toHaveText('1009')
    await expect
      .poll(async () => {
        const { attrib, ownAttrib } = await api.getTask(projectName, task.id)
        return { frameStart: attrib.frameStart, own: ownAttrib.includes('frameStart') }
      })
      .toEqual({ frameStart: 1009, own: true })
  })
})
