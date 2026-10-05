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
})
