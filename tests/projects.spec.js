// @ts-check
import { test, expect } from '@playwright/test'
import { getProjectName } from './fixtures/project'

// This test suite is for creating and deleting projects
test.describe.serial('project_create_delete', () => {
  // creates a new project
  test('new-project', async ({ page }, { project }) => {
    const projectName = getProjectName('test_project')(project.name)
    await page.goto('/manageProjects')
    // click on the create new project button
    await page.getByRole('button', { name: 'create_new_folder Add New' }).click()
    // set project name
    await page.getByPlaceholder('Project Name').fill(projectName)
    // wait for anatomy to load
    await expect(page.getByRole('heading', { name: 'Roots' }).nth(1)).toBeVisible()
    // click create button
    await page.getByRole('button', { name: 'check Create Project' }).click()
    // check if the project is created successfully from toast message
    await page.getByText('Project created').click()
    // check the project is in the list
    await expect(page.getByRole('row', { name: projectName })).toBeVisible()
  })

  // deletes newly created project
  test('delete-project', async ({ page }, { project }) => {
    const projectName = getProjectName('test_project')(project.name)
    await page.goto('/manageProjects')

    const projectCell = await page.getByRole('cell', { name: projectName })
    const projectCellText = await page.getByText(projectName, { exact: true })
    //   right click on the project
    await projectCell.click({
      button: 'right',
    })
    // deactivate the project
    await page.getByRole('menuitem', { name: 'archive Deactivate Project' }).click()
    // check project was deactivated successfully by checking if font is italic
    await expect(projectCellText).toHaveCSS('font-style', 'italic')
    // right click on the project again
    await projectCell.click({
      button: 'right',
    })
    // delete the project
    await page.getByRole('menuitem', { name: 'delete Delete Project' }).click()
    // confirm the deletion
    await page.getByLabel('Delete', { exact: true }).click()
    // check if the project is deleted successfully from toast message
    await expect(page.getByText(`Project: ${projectName} deleted`)).toBeVisible()

    await expect(page.getByRole('cell', { name: projectName })).toBeHidden()
  })
})
