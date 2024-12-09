import { expect, test as base } from '@playwright/test'
import type { Page } from '@playwright/test'

class ProjectUserAccessGroupsPage {
  constructor(public readonly page: Page, public readonly browserName: String) {}

  async goto(userName?: string) {
    await this.page.goto(`/manageProjects/projectAccess`)
  }

  async selectProject(project: string, navigationNeeded = false) {
    if (navigationNeeded) {
      await this.goto()
    }
    await this.page.getByTestId(`projectPanel`).getByText(project).click()
  }

  async selectUnassignedUser(user: string, navigationNeeded = false) {
    if (navigationNeeded) {
      await this.goto()
    }
    await this.page.getByText(user).click()
  }

  async selectAssignedUser(user: string, accessGroup: string) {
    await this.goto()
  }

  async assignToAccessGroups(
    project: string,
    user: string,
    accessGroups: string[],
    navigationNeeded = false,
  ) {
    if (navigationNeeded) {
      await this.goto()
    }
    this.selectProject(project)
    this.selectUnassignedUser(user)
    await this.page.getByRole('button', { name: 'add Add access' }).click()
    for (const accessGroup of accessGroups) {
      await this.page.getByTestId(`access-group-${accessGroup}`).click()
    }
    await this.page.getByRole('button', { name: 'check Save' }).click()
    await expect(this.page.getByText('Access added')).toBeVisible()
  }

  async removeFromAccessGroup(project: string, user: string, accessGroup: string) {
    this.selectProject(project)
    await this.page.getByTestId(`accessGroupPanel-${accessGroup}`)
    await this.page.getByTestId(`accessGroupPanel-${accessGroup}`).getByText(user).click()
    await this.page.getByRole('button', { name: 'remove Remove access' }).click()
    await expect(this.page.getByText('Access removed')).toBeVisible()
  }
}

const test = base.extend<{ userPage: ProjectUserAccessGroupsPage }>({
  userPage: async ({ page, browserName }, use) => {
    const projectUserAccessGroupsPage = new ProjectUserAccessGroupsPage(page, browserName)
    await use(projectUserAccessGroupsPage)
  },
})

export { test as projectUserAccessGroupsTest }

export default ProjectUserAccessGroupsPage
