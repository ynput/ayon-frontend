import { expect, test as base } from '@playwright/test'
import type { Page } from '@playwright/test'

class BrowserPage {
  constructor(public readonly page: Page, public readonly browserName: String) {}

  async goto(projectName) {
    await this.page.goto(`/projects/${projectName}/browser`)
  }

  async addFolderComment(projectName, folderName, comment) {
    await this.goto(projectName)
    try {
      const snoozeIsVisible = await this.page.getByRole('button', { name: 'snooze Snooze' }).isVisible()
      if (snoozeIsVisible) {
        await this.page.getByRole('button', { name: 'snooze Snooze' }).click()
      }
    } catch (e) { }

    await this.page.getByRole('cell', { name: `folder${folderName}` }).click()
    await this.page.getByText('Add a comment...').click()
    await this.page.locator('.ql-editor').fill(comment)
    await this.page.getByRole('button', { name: 'Comment' }).click()
  }

  async addReactionToComment(
    projectName,
    folderName,
    reaction,
    { skipNavigation } = { skipNavigation: true },
  ) {
    if (!skipNavigation) {
      await this.goto(projectName)
    }

    await this.page.getByRole('cell', { name: `folder${folderName}` }).click()
    await expect(
      this.page.getByRole('main').getByRole('button', { name: 'more_horiz' }),
    ).toBeVisible()
    await this.page.getByText('add_reaction').click()
    await this.page.getByText(reaction, { exact: true }).click()
    await expect(this.page.getByText('👍👎❤🎉📝')).toBeHidden()
    await expect(this.page.getByText(reaction)).toBeVisible()
  }

  async removeReactionFromComment(
    projectName,
    folderName,
    reaction,
    { skipNavigation } = { skipNavigation: true },
  ) {
    if (!skipNavigation) {
      await this.goto(projectName)
    }

    await this.page.getByRole('cell', { name: `folder${folderName}` }).click()
    await expect(
      this.page.getByRole('main').getByRole('button', { name: 'more_horiz' }),
    ).toBeVisible()
    await this.page.getByText(reaction).click()
  }

  async removeFolderComment(projectName, folderName, comment) {
    await this.goto(projectName)
    await this.page.getByRole('cell', { name: `folder${folderName}` }).click()
    this.page.getByText(`edit_square more_horiz ${comment}`).hover()
    await this.page.getByRole('main').getByRole('button', { name: 'more_horiz' }).click()
    await this.page.getByText('deleteDelete').click()
  }
}

const test = base.extend<{ browserPage: BrowserPage }>({
  browserPage: async ({ page, browserName }, use) => {
    const browserPage = new BrowserPage(page, browserName)
    await use(browserPage)
  },
})

export default BrowserPage

export { test as browserTest }
