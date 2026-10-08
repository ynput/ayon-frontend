import { randomBytes } from 'crypto'
import { expect, test } from '../fixtures'
import { AccountPage } from '../pages/AccountPage'
import { apiAs, signInAs } from '../support/session'

test.describe('account profile', () => {
  test('change my full name', async ({ api, createUser, browser }) => {
    const user = await createUser({ fullName: 'Profile Before' })
    const { context, page } = await signInAs(browser, user.name, user.password)
    try {
      const account = new AccountPage(page)
      await account.goto()
      await expect(account.input('Full name')).toHaveValue('Profile Before')

      await account.setFullName('Profile After')

      await expect(page.locator('main').getByText('Profile After', { exact: true })).toBeVisible()
      await expect(account.saveButton).toBeDisabled()
      await expect
        .poll(async () => (await api.getUser(user.name)).attrib.fullName)
        .toBe('Profile After')
    } finally {
      await context.close()
    }
  })

  test('change my password and sign in with the new one', async ({
    createUser,
    browser,
  }, testInfo) => {
    const user = await createUser()
    // non-admins get the server's complexity check: letters, digits and a special character
    const newPassword = `Pw_${randomBytes(6).toString('hex')}_42!`

    const session = await signInAs(browser, user.name, user.password)
    try {
      const account = new AccountPage(session.page)
      await account.goto()
      await account.changePassword(user.name, newPassword)
    } finally {
      await session.context.close()
    }

    const again = await signInAs(browser, user.name, newPassword)
    await again.context.close()
    await expect(apiAs(testInfo, user.name, user.password)).rejects.toThrow(
      /Invalid login\/password/,
    )
  })
})
