import { expect } from '@playwright/test'


const createFolder = async (page, projectName, folderName) => {
  await page.goto(`/projects/${projectName}/editor`)

  await page.getByRole('button', { name: 'create_new_folder Add Folders' }).click()
  await expect(page.getByText('add new root folder')).toBeVisible()
  await page.locator('li[data-value="Folder"]').click()
  await page.locator('input[value="Folder"]').fill(folderName)
  await page.getByRole('button', { name: 'check Add and Close' }).click()
  await expect(page.getByRole('cell', { name: folderName })).toBeVisible()
  await page.getByRole('button', { name: 'check Save Changes' }).click()
  await page.getByText('Changes saved').click()
}

const deleteFolder = async (page, projectName, folderName) => {
  await page.goto(`/projects/${projectName}/editor`)
  await expect(page.getByRole('cell', { name: folderName })).toBeVisible()
  await page.getByRole('cell', { name: folderName }).click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'delete Delete' }).click()
  await page.getByRole('button', { name: 'check Save Changes' }).click()
  await page.getByText('Changes saved').click()
  await expect(page.getByRole('cell', { name: folderName })).toBeHidden()
}

export { createFolder, deleteFolder }
