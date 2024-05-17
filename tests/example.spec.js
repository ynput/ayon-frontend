// @ts-check
const { test, expect } = require('@playwright/test')

// Check that the title of the page is correct (contains "Ayon").
test('has title', async ({ page }) => {
  await page.goto('/')

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Ayon/)
})
