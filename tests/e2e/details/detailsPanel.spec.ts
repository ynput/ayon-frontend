import { Page } from '@playwright/test'
import { expect, test } from '../fixtures'
import { AyonApi } from '../support/api'
import { OverviewPage } from '../pages/OverviewPage'

const setup = async (api: AyonApi, projectName: string) => {
  const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
  const task = await api.createTask(projectName, {
    folderId: folder.id,
    name: 'layout',
    taskType: 'Layout',
  })
  return { folder, task }
}

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

  test('open subtasks while the planner module is still loading', async ({
    page,
    api,
    projectName,
  }) => {
    test.skip(!(await api.hasAddon('planner')), 'subtasks need the planner addon')
    const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    await api.createTask(projectName, {
      folderId: folder.id,
      name: 'layout',
      taskType: 'Layout',
      data: { subtasks: [{ name: 'sky', label: 'Sky is flat' }] },
    })
    let releaseModule = () => {}
    const moduleHeld = new Promise<void>((resolve) => (releaseModule = resolve))
    await page.route('**/SubtasksManager-*.js', async (route) => {
      await moduleHeld
      await route.continue()
    })
    const moduleRequested = page.waitForRequest('**/SubtasksManager-*.js')

    const { panel } = await openTask(page, projectName)
    await moduleRequested
    await panel.openTab('subtasks')
    releaseModule()

    await expect(panel.root.getByText('Sky is flat')).toBeVisible()
    await expect(page.getByText('Try for free!')).toBeHidden()
  })

  test('assign a user', async ({ page, api, projectName, createUser, accessGroup }) => {
    const fullName = `Panel${Math.random().toString(36).slice(2, 7)}`
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

  test('add a tag when the project anatomy has no tags', async ({ page, api, projectName }) => {
    await api.patch(`/api/projects/${projectName}`, { tags: [] })
    const { task } = await setup(api, projectName)
    const { panel } = await openTask(page, projectName)
    await panel.openTab('details')

    await panel.attribute('Tags').click()
    const search = page.locator('.search').getByRole('textbox')
    await search.click()
    await expect(search).toBeFocused()
    await search.fill('adhoc_tag')
    await search.press('Enter')

    await expect
      .poll(async () => (await api.getTask(projectName, task.id)).tags)
      .toEqual(['adhoc_tag'])
    // Escape would also close the panel, so the dropdown is closed by clicking outside
    await panel.attribute('Name').click()
    await expect(panel.attribute('Tags')).toContainText('adhoc_tag')
  })

  test('search subtasks for all words of any comma separated part', async ({
    page,
    api,
    projectName,
  }) => {
    test.skip(!(await api.hasAddon('planner')), 'subtasks need the planner addon')
    const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    await api.createTask(projectName, {
      folderId: folder.id,
      name: 'layout',
      taskType: 'Layout',
      data: {
        subtasks: [
          { name: 'shadow', label: 'Shadow on the car' },
          { name: 'paint', label: 'Car paint too red' },
          { name: 'sky', label: 'Sky is flat' },
        ],
      },
    })
    // FLAG: opening Subtasks before the planner module has loaded shows the planner upsell and returns to the feed
    const plannerLoaded = page.waitForResponse((res) => res.url().includes('/SubtasksManager-'))
    const { panel } = await openTask(page, projectName)
    await plannerLoaded
    await panel.openTab('subtasks')
    await expect(panel.subtask('Sky is flat')).toBeVisible()

    await panel.searchSubtasks('car red, sky')

    await expect(panel.subtask('Shadow on the car')).toBeHidden()
    await expect(panel.subtask('Car paint too red')).toBeVisible()
    await expect(panel.subtask('Sky is flat')).toBeVisible()
  })
})
