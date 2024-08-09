import { test, expect } from '@playwright/test'
import { createProject, deleteProject, getProjectName } from './fixtures/project'

const getFolderName = (browser) => 'test_folder_' + browser

// This test suite is for creating and deleting folders
test.describe.serial('folder_create_delete', () => {
  test('new-folder', async ({ page }, { project }) => {
    const projectName = getProjectName('test_project_folder')(project.name)
    const folderName = getFolderName(project.name)

    await createProject(page, projectName)

    await page.goto(`/projects/${projectName}/editor`)
    // click on the create new bundle button
    await page.getByRole('button', { name: 'create_new_folder Add Folders' }).click()
    // wait for anatomy to load
    await expect(page.getByText('add new root folder')).toBeVisible()

    // select "Folder" list item
    await page.locator('li[data-value="Folder"]').click()


    // set folder name
    await page.locator('input[value="Folder"]').fill(folderName)

    await page.getByRole('button', { name: 'check Add and Close' }).click()

    // check if the folder is in the list
    await expect(page.getByRole('cell', { name: folderName })).toBeVisible()

    await page.getByRole('button', { name: 'check Save Changes' }).click()

    // check if the folder is created successfully - toast message showing
    await page.getByText('Changes saved').click()
  })

  test('delete-folder', async ({ page }, { project }) => {
    var projectName = getProjectName('test_project_folder')(project.name)
    const folderName = getFolderName(project.name)

    await page.goto(`/projects/${projectName}/editor`)

    await expect(page.getByRole('cell', { name: folderName })).toBeVisible()

    // select folder
    await page.getByRole('cell', { name: folderName }).click({ button: 'right' })

    // delete folder
    await page.getByRole('menuitem', { name: 'delete Delete' }).click()

    await page.getByRole('button', { name: 'check Save Changes' }).click()

    // check if the folder is created successfully - toast message showing

    await page.getByText('Changes saved').click()
    // check bundle is removed from the list
    await expect(page.getByRole('cell', { name: folderName })).toBeHidden()

    await deleteProject(page, projectName)

    await expect(page.getByRole('cell', { name: projectName })).toBeHidden()
  })
})
