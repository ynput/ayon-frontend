import { expect, test } from '../fixtures'
import { uniqueName } from '../support/names'
import { SecretsPage } from '../pages/SecretsPage'

// Secrets are studio wide: every test uses its own uniquely named secret and removes it in `finally`.
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
      // the stored value is shown after a reload
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
})
