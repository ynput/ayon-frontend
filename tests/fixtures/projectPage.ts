import { expect, test as base } from '@playwright/test'
import type { Page } from '@playwright/test'

const getProjectName = (prefix) => (browser) => prefix + '_' + browser

class ProjectPage {
  constructor(public readonly page: Page, public readonly browserName: string) {}

  async goto() {
    await this.page.goto('/manageProjects')
  }

  async createProject(name: string) {
    await this.goto()
    await this.page.getByRole('button', { name: 'create_new_folder Add New' }).click()
    await this.page.getByPlaceholder('Project Name').fill(name)
    await expect(this.page.getByRole('heading', { name: 'Roots' }).nth(1)).toBeVisible()
    await this.page.getByRole('button', { name: 'check Create Project' }).click()
    await this.page.getByText('Project created').click()
    await expect(this.page.getByRole('row', { name: name })).toBeVisible()
  }

  async deleteProject(name) {
    await this.page.goto('/manageProjects')
    const projectCell = await this.page.getByRole('cell', { name })
    const projectCellText = await this.page.getByText(name, { exact: true })
    await projectCell.click({ button: 'right' })
    await this.page.getByRole('menuitem', { name: 'archive Archive Project' }).click()
    await expect(projectCellText).toHaveCSS('font-style', 'italic')
    await projectCell.click({ button: 'right' })
    await this.page.getByRole('menuitem', { name: 'delete Delete Project' }).click()
    await this.page.getByLabel('Delete', { exact: true }).click()
    await expect(this.page.getByText(`Project: ${name} deleted`)).toBeVisible()
    await expect(this.page.getByRole('cell', { name })).toBeHidden()
  }
}

const test = base.extend<{ projectPage: ProjectPage }>({
  projectPage: async ({ page, browserName }, use) => {
    const projectPage = new ProjectPage(page, browserName)
    await use(projectPage)
  },
})

export default ProjectPage
export { getProjectName, test as projectTest }
