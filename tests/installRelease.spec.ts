import { test } from '@playwright/test'
import { installReleaseTest } from './fixtures/installRelease'

installReleaseTest('install-release', async ({ installRelease }) => {
  test.setTimeout(80000)
  await installRelease.goto()
  await installRelease.openMenu()
  await installRelease.changeAddons()
  await installRelease.changePlatforms()
  await installRelease.install()
})
