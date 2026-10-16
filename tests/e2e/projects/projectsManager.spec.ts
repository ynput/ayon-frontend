import { expect, test } from '../fixtures'
import { uniqueName } from '../support/names'
import { ProjectsManagerPage } from '../pages/ProjectsManagerPage'

test.describe('projects manager', () => {
  test('create a new project from the dialog', async ({ page, api }) => {
    const name = uniqueName('newproj')
    const code = `e2e${Math.random().toString(36).slice(2, 8)}`
    // registered before the UI creates it, so it is removed even if the test fails half way
    test.info().attach('project', { body: name })
    try {
      const manager = new ProjectsManagerPage(page)
      await manager.goto()
      await manager.createProject({ label: name, code })

      const project = await api.getProject(name)
      expect(project.code).toBe(code)
      expect(project.active).toBe(true)
      // created with the default anatomy
      expect(project.folderTypes.length).toBeGreaterThan(0)
      expect(project.taskTypes.length).toBeGreaterThan(0)

      await manager.projects.search(name)
      await expect(manager.projectRow(name)).toBeVisible()
    } finally {
      await api.deleteProject(name)
    }
  })

  test('archive and then delete a project', async ({ page, api, projectName }) => {
    const manager = new ProjectsManagerPage(page)
    await manager.goto()

    await manager.archiveProject(projectName)
    await expect.poll(async () => (await api.getProject(projectName)).active).toBe(false)

    // archived projects drop out of the list until "Show archived" is on
    await expect(manager.projectRow(projectName)).toBeHidden()
    await manager.showArchived()
    await expect(manager.projectRow(projectName)).toBeVisible()

    await manager.deleteProject(projectName)
    await expect.poll(() => api.projectExists(projectName)).toBe(false)
    await expect(manager.projectRow(projectName)).toBeHidden()
  })

  test('activate an archived project', async ({ page, api, projectName }) => {
    await api.patch(`/api/projects/${projectName}`, { active: false })
    const manager = new ProjectsManagerPage(page)
    await manager.goto()
    await manager.showArchived()

    await manager.activateProject(projectName)

    await expect.poll(async () => (await api.getProject(projectName)).active).toBe(true)
    // toggle "Show archived" off again: active projects are listed without it
    await manager.showArchived()
    await manager.projects.search(projectName)
    await expect(manager.projectRow(projectName)).toBeVisible()
  })

  test('rename the label of a project', async ({ page, api, projectName }) => {
    const label = `E2E Renamed ${Math.random().toString(36).slice(2, 8)}`
    const manager = new ProjectsManagerPage(page)
    await manager.goto()

    await manager.renameProject(projectName, label)

    await expect.poll(async () => (await api.getProject(projectName)).label).toBe(label)
    await expect(manager.projectRow(label)).toBeVisible()
    expect(await api.projectExists(projectName)).toBe(true)
  })

  test('change a project attribute in the project anatomy', async ({ page, api, projectName }) => {
    expect((await api.getProject(projectName)).attrib.fps).not.toBe(48)
    const manager = new ProjectsManagerPage(page)
    await manager.goto('anatomy', projectName)
    await manager.anatomy.expand('Attributes')

    const fps = manager.anatomy.field('root_attributes_fps').getByRole('spinbutton')
    await fps.fill('48')
    await fps.blur()
    await manager.saveAnatomy()

    await expect.poll(async () => (await api.getProject(projectName)).attrib.fps).toBe(48)
    await manager.goto('anatomy', projectName)
    await manager.anatomy.expand('Attributes')
    await expect(fps).toHaveValue('48')
  })

  // FLAG (app bug): Select/Checkbox widgets report their null defaults on mount, which enables "Save changes"
  // fixed in ynput/ayon-frontend#2398, switch back to test() once it is merged
  test.fixme(
    'viewing the project anatomy does not mark it as changed',
    async ({ page, projectName }) => {
      const manager = new ProjectsManagerPage(page)
      await manager.goto('anatomy', projectName)
      const save = page.getByRole('button', { name: 'Save changes' })
      await expect(save).toBeDisabled()

      await manager.anatomy.expand('Attributes')

      await expect(
        manager.anatomy.field('root_attributes_fps').getByRole('spinbutton'),
      ).toBeVisible()
      await expect(save).toBeDisabled()
    },
  )

  test('give a user access to a project with an access group', async ({
    page,
    api,
    projectName,
    createUser,
    accessGroup,
  }) => {
    const user = await createUser()
    const manager = new ProjectsManagerPage(page)
    await manager.goto('projectAccess', projectName)

    await manager.addProjectAccess(user.name, accessGroup)

    await expect(manager.accessUserRow(user.name)).toContainText(accessGroup)
    await expect
      .poll(async () => (await api.getUser(user.name)).data.accessGroups?.[projectName])
      .toEqual([accessGroup])
  })
})
