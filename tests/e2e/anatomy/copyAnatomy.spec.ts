import { expect, test } from '../fixtures'
import { toast } from '../support/ui'
import { ProjectsManagerPage } from '../pages/ProjectsManagerPage'

// Changes the anatomy of the test's own projects only: `projectName` and a second project it
// creates and deletes.

test.describe('project anatomy: copy and paste', () => {
  test('copy the anatomy of another project and paste it into this one', async ({
    page,
    context,
    api,
    projectName,
  }) => {
    const source = await api.createProject()
    try {
      await api.updateProjectAnatomy(source, (anatomy) => ({
        ...anatomy,
        statuses: [
          ...anatomy.statuses,
          { name: 'Waiting for client', state: 'blocked', scope: ['task'] },
        ],
        attributes: { ...anatomy.attributes, fps: 48 },
      }))
      const index = (await api.getProject(projectName)).statuses.length
      // "Copy anatomy" and "Paste anatomy" use navigator.clipboard; headless Chromium keeps its own
      // clipboard per browser
      await context.grantPermissions(['clipboard-read', 'clipboard-write'])
      const manager = new ProjectsManagerPage(page)
      await manager.goto('anatomy', source)
      await manager.anatomy.expand('Statuses')
      await expect(manager.anatomy.textbox(`root_statuses_${index}_name`)).toHaveValue(
        'Waiting for client',
      )

      await page.getByRole('button', { name: 'Copy anatomy' }).click()
      await expect(toast(page, 'Copied To Clipboard')).toBeVisible()
      await manager.projects.select(projectName)
      // this project's anatomy has loaded: it does not have the extra status
      await expect(page).toHaveURL(new RegExp(`project=${projectName}`))
      await expect(manager.anatomy.textbox(`root_statuses_${index - 1}_name`)).toBeVisible()
      await expect(manager.anatomy.textbox(`root_statuses_${index}_name`)).toBeHidden()
      await page.getByRole('button', { name: 'Paste anatomy' }).click()

      await expect(manager.anatomy.textbox(`root_statuses_${index}_name`)).toHaveValue(
        'Waiting for client',
      )
      await manager.saveAnatomy()
      await expect
        .poll(async () => {
          const { statuses, attrib } = await api.getProject(projectName)
          return { status: statuses[index]?.name, fps: attrib.fps }
        })
        .toEqual({ status: 'Waiting for client', fps: 48 })
    } finally {
      await api.deleteProject(source)
    }
  })
})
