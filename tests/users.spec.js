const { test, expect } = require('@playwright/test')

const getUserName = (browser) => 'test_' + browser

// This test suite is for creating and deleting users
test.describe.serial('user_create_delete', () => {
  // creates a new user
  test('new-user', async ({ page }, { project }) => {
    const userName = getUserName(project.name)
    await page.goto('/settings/users')
    // click on the create new user button
    await page.getByRole('button', { name: 'person_add Add New User' }).click()
    // set user name
    await page.getByPlaceholder('No spaces allowed').fill(userName)
    // create user
    await page.getByRole('button', { name: 'check Create and close' }).click()
    // check toast message
    await expect(page.getByText('User created')).toBeVisible()
    // check if the user is in the list
    await expect(
      page.locator('span').filter({ hasText: new RegExp(`^${userName}$`) }),
    ).toBeVisible()
  })

  //   deletes newly created user
  test('delete-user', async ({ page }, { project }) => {
    const userName = getUserName(project.name)
    await page.goto(`http://127.0.0.1:3000/settings/users?name=${userName}`)
    // click on delete button (top right)
    await page.getByRole('button', { name: 'person_remove Delete Users' }).click()
    // confirm the deletion
    await page.getByLabel('Delete', { exact: true }).click()
    // check toast
    await expect(page.getByText('Deleted 1 user(s)')).toBeVisible()
    // check user is removed from the list
    await expect(page.locator('span').filter({ hasText: new RegExp(`^${userName}$`) })).toBeHidden()
  })
})
