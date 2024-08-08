import { expect } from '@playwright/test'

const getProjectName = (browser) => 'test_folder_project_' + browser

const createProject = async (page, browser) => {
    const projectName = getProjectName(browser)
    await page.goto('/manageProjects')
    await page.getByRole('button', { name: 'create_new_folder Add New' }).click()
    await page.getByPlaceholder('Project Name').fill(projectName)
    await expect(page.getByRole('heading', { name: 'Roots' }).nth(1)).toBeVisible()
    await page.getByRole('button', { name: 'check Create Project' }).click()
}

  const deleteProject = async (page, browser) => {
    const projectName = getProjectName(browser)
    await page.goto('/manageProjects')
    const projectCell = page.getByRole('cell', { name: projectName })
    const projectCellText = await page.getByText(projectName, { exact: true })
    await projectCell.click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'archive Deactivate Project' }).click()
    await expect(projectCellText).toHaveCSS('font-style', 'italic')
    await projectCell.click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'delete Delete Project' }).click()
    await page.getByLabel('Delete', { exact: true }).click()
    await expect(page.getByText(`Project: ${projectName} deleted`)).toBeVisible()
    await expect(page.getByRole('cell', { name: projectName })).toBeHidden()
  }

export { createProject, deleteProject, getProjectName }