import { test, expect } from '@playwright/test'
import { createProject, deleteProject, getProjectName } from './fixtures/project'
import { createFolder, getFolderName } from './fixtures/folder'
import { BrowserRouter } from 'react-router-dom'

const getTaskName = prefix => (browser) => prefix + '_' + browser

test.describe.serial('task_create_delete', () => {
  test.skip('new-task', async ({ page }, { project }) => {
    const projectName = getProjectName('test_task_project')(project.name)
    const folderName = getFolderName('test_task_folder')(project.name)
    const taskName = getTaskName(project.name)(project.name)

    await createProject(page, projectName)
    await createFolder(page, projectName, folderName)

    await page.getByText(folderName).click()
    await page.getByRole('button', { name: 'add_task Add tasks' }).click()

    await page.getByText('task_altGeneric').click()
    await page.locator('input[value="Generic"]').fill(taskName)
    await page.getByRole('button', { name: 'check Add and Close' }).click()

    await expect(page.getByRole('cell', { name: taskName })).toBeVisible()

    await page.getByRole('button', { name: 'check Save Changes' }).click()
    await page.getByText('Changes saved').click()
  })

  test.skip('delete-task', async ({ page }, { project }) => {
    const projectName = getProjectName('test_task_project')(project.name)
    const folderName = getFolderName('test_task_folder')(project.name)

    // Minor hack: Double navigation to actually load the editor page, it was giving inconsistent results without it.
    await page.goto(`/`)
    await page.goto(`/projects/${projectName}/editor`)

    var folderLocator = page.locator('.p-treetable-scrollable-body span').getByText(folderName)
    expect(folderLocator).toBeVisible()
    folderLocator.dblclick()

    const taskName = getTaskName('test_task')(project.name)

    await page.getByRole('cell', { name: taskName }).click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'delete Delete' }).click()

    await page.getByRole('button', { name: 'check Save Changes' }).click()
    await page.getByText('Changes saved').click()
    await expect(page.getByRole('cell', { name: taskName })).toBeHidden()

    await deleteProject(page, projectName)
  })
})

export { getTaskName }


