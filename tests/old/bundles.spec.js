import { test, expect } from '@playwright/test'

const getBundleName = (browser) => 'test_bundle_' + browser

// This test suite is for creating and deleting users
test.describe.serial('bundle_create_delete', () => {
  // creates a new user
  test.skip('new-bundle', async ({ page }, { project }) => {
    const bundleName = getBundleName(project.name)
    await page.goto('/settings/bundles')
    // click on the create new bundle button
    await page.getByRole('button', { name: 'add Add Bundle' }).click()
    // set bundle name
    await page.getByRole('main').getByRole('textbox').fill(bundleName)
    // open launcher dropdown
    await page.getByRole('button', { name: 'Select an option...' }).click()
    // select launcher
    const launcher = '1.0.2'
    await page.getByText(launcher).click()
    // click create button
    await page.getByRole('button', { name: 'check Create new bundle' }).click()
    // check toast
    await expect(page.getByText('Bundle created')).toBeVisible()
    // check if the bundle is in the list
    await expect(page.getByRole('cell', { name: bundleName })).toBeVisible()
  })

  //   deletes newly created user
  test.skip('delete-bundle', async ({ page }, { project }) => {
    const bundleName = getBundleName(project.name)
    await page.goto('/settings/bundles')
    // right click bundle
    await page.getByRole('cell', { name: bundleName }).click({
      button: 'right',
    })
    // archive bundle
    await page.getByRole('menuitem', { name: 'archive Archive' }).click()
    // right click on archived bundle
    await page.getByRole('cell', { name: `${bundleName} (archived)` }).click({
      button: 'right',
    })
    // delete bundle
    await page.getByRole('menuitem', { name: 'delete Delete' }).click()
    // confirm the deletion
    await page.getByLabel('Delete', { exact: true }).click()
    // check toast
    await expect(page.getByText('bundles deleted')).toBeVisible()
    // check bundle is removed from the list
    await expect(page.getByRole('cell', { name: bundleName })).toBeHidden()
  })
})
