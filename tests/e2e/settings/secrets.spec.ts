import { expect, test } from '../fixtures'
import { uniqueName } from '../support/names'
import { SecretsPage } from '../pages/SecretsPage'

test.describe('secrets', () => {
  test('add a secret', async ({ page, api }) => {
    const name = uniqueName('secret')
    try {
      const secrets = new SecretsPage(page)
      await secrets.goto()

      await secrets.addSecret(name, 'first-value')

      await expect(secrets.secretRow(name)).toBeVisible()
      await expect(secrets.secretRow(name).getByPlaceholder('Secret value')).toHaveValue(
        'first-value',
      )
      await expect.poll(() => api.getSecretValue(name)).toBe('first-value')
    } finally {
      await api.deleteSecret(name)
    }
  })

  test('change the value of a secret', async ({ page, api }) => {
    const name = uniqueName('secret')
    await api.setSecret(name, 'old-value')
    try {
      const secrets = new SecretsPage(page)
      await secrets.goto()

      await secrets.updateSecret(name, 'new-value')

      await expect.poll(() => api.getSecretValue(name)).toBe('new-value')
      await secrets.goto()
      await expect(secrets.secretRow(name).getByPlaceholder('Secret value')).toHaveValue(
        'new-value',
      )
    } finally {
      await api.deleteSecret(name)
    }
  })

  test('delete a secret', async ({ page, api }) => {
    const name = uniqueName('secret')
    await api.setSecret(name, 'doomed-value')
    try {
      const secrets = new SecretsPage(page)
      await secrets.goto()

      await secrets.deleteSecret(name)

      await expect(secrets.secretRow(name)).toBeHidden()
      await expect.poll(() => api.getSecretValue(name)).toBeUndefined()
    } finally {
      await api.deleteSecret(name)
    }
  })

  // FLAG (app bug): Secrets.jsx rendered `{data?.length && ...}`, a literal "0" when no secrets were left
  // fixed in ynput/ayon-frontend#2400, switch back to test() once it is merged
  test.fixme('deleting the last secret leaves an empty list', async ({ page, api }) => {
    const name = uniqueName('secret')
    await api.setSecret(name, 'last-value')
    try {
      // other secrets are not the test's to delete, so the page only gets to see this one
      await page.route('**/api/secrets', async (route) => {
        if (route.request().method() !== 'GET') return route.continue()
        const response = await route.fetch()
        const stored: { name: string }[] = await response.json()
        await route.fulfill({ response, json: stored.filter((s) => s.name === name) })
      })
      const secrets = new SecretsPage(page)
      await secrets.goto()
      await expect(secrets.secretRow(name)).toBeVisible()

      await secrets.deleteSecret(name)

      // the row goes away in the same render that would show the "0"
      await expect(secrets.secretRow(name)).toBeHidden()
      await expect(secrets.list).toHaveText(/Stored secrets$/)
      await expect.poll(() => api.getSecretValue(name)).toBeUndefined()
    } finally {
      await api.deleteSecret(name)
    }
  })
})
