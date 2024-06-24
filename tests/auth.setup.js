import { test as setup } from '@playwright/test'

const authFile = 'playwright/.auth/user.json'

setup('authenticate', async ({ page }) => {
  console.log('USERNAME:', process.env.NAME)
  // Perform authentication steps. Replace these actions with your own.
  await page.getByLabel('Username').fill(process.env.NAME)
  await page.getByLabel('Password').fill(process.env.PASSWORD)
  await page.getByRole('button', { name: 'Login', exact: true }).click()
  // Wait until the page receives the cookies.
  //
  // Sometimes login flow sets cookies in the process of several redirects.
  // Wait for the final URL to ensure that the cookies are actually set.
  await page.waitForURL('/')

  // End of authentication steps.

  await page.context().storageState({ path: authFile })
})
