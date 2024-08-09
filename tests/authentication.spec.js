import { test, expect } from '@playwright/test'

test.use({ storageState: { cookies: [], origins: [] } })

// This test suite is for creating and deleting users
test.describe.serial('user_login_logout', () => {
  test('user_login', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    // Perform authentication steps. Replace these actions with your own.
    await page.getByLabel('Username').fill(process.env.NAME)
    await page.getByLabel('Password').fill(process.env.PASSWORD)
    await page.getByRole('button', { name: 'Login', exact: true }).click()
    // Wait until the page receives the cookies.
    //
    // Sometimes login flow sets cookies in the process of several redirects.
    // Wait for the final URL to ensure that the cookies are actually set.
    await page.waitForURL('http://localhost:3000/dashboard/tasks')
  })

  test('user_logout', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    // Perform authentication steps. Replace these actions with your own.
    await page.getByLabel('Username').fill(process.env.NAME)
    await page.getByLabel('Password').fill(process.env.PASSWORD)
    await page.getByRole('button', { name: 'Login', exact: true }).click()
    await page.waitForURL('http://localhost:3000/dashboard/tasks')

    await page.getByLabel('User menu').click()
    await page.getByText('Sign out').click()
    expect(page).toHaveURL('/login')
  })
})
