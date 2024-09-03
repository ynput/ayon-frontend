import { getBundleName, bundleTest as test } from './fixtures/bundlePage'

test('create/delete bundle', async ({ bundlePage, browserName }) => {
  const bundleName = getBundleName('test_bundle')(browserName)
  await bundlePage.goto()
  await bundlePage.createBundle(bundleName)
  await bundlePage.deleteBundle(bundleName)
})

// 1. Sets the bundle status to production
// 2. Set a different bundle status to staging and copy settings from the production bundle
test('bundle status', async ({ bundlePage, browserName }) => {
  const prodBundleName = getBundleName('test_bundle_status', 'status_production')(browserName)
  await bundlePage.goto()
  // create the base bundle if it doesn't exist
  await bundlePage.createBundle(prodBundleName)
  // set bundle status to production
  await bundlePage.setBundleStatus(prodBundleName, 'production')
  // create a new bundle
  const stagingBundleName = getBundleName('test_bundle_status', 'status_staging')(browserName)
  await bundlePage.createBundle(stagingBundleName)
  // set bundle status to staging
  await bundlePage.setBundleStatus(stagingBundleName, 'staging')
  // check copy settings dialog opens and works
  await bundlePage.copySettingsDialog('staging', true)
  // CLEANUP: unset statuses
  await bundlePage.unsetBundleStatus(prodBundleName, 'production')
  await bundlePage.unsetBundleStatus(stagingBundleName, 'staging')
  // delete bundles
  await bundlePage.deleteBundle(prodBundleName)
  await bundlePage.deleteBundle(stagingBundleName)
})
