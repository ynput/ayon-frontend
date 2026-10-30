import { expect } from '@playwright/test'
import { addonDevVersion } from './addon'
import { AyonApi, login } from './api'
import { addonDev, adminCredentials } from './env'

/**
 * What the suite needs before any test runs, each with what to do when it is missing: an admin
 * account, and in an addon's suite the dev build's version installed on the server (its server code).
 * Call it from a setup project:
 *
 *   // tests/e2e/prerequisites.setup.ts
 *   setup('the server is ready', ({ baseURL }) => checkPrerequisites(baseURL!))
 */
export const checkPrerequisites = async (baseURL: string) => {
  const { name, password } = adminCredentials()
  const { api, user } = await login(AyonApi, baseURL, name, password)
  try {
    expect(user.data.isAdmin, `${name} must be an admin to run the e2e tests`).toBeTruthy()
    const dev = addonDev()
    if (!dev) return
    const version = await addonDevVersion()
    expect(
      await api.hasAddonVersion(dev.addon, version),
      `${dev.addon} ${version} must be installed on the server (its server code), e.g. with create_package.py and an upload`,
    ).toBe(true)
  } finally {
    await api.dispose()
  }
}
