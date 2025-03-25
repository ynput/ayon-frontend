import { getBundleName, bundleTest as test } from './fixtures/bundlePage'

const BUNDLE_PREFIX = 'test_bundle_status'
const BUNDLE_SUFFIX_PROD = 'status_production'
const BUNDLE_SUFFIX_STAGING =  'status_staging'

// 1. Sets the bundle status to production
// 2. Set a different bundle status to staging and copy settings from the production bundle
test('bundle status', async ({ bundlePage, browserName }) => {
  const bundleNameProd = getBundleName(BUNDLE_PREFIX, BUNDLE_SUFFIX_PROD)(browserName)
  const bundleNameStaging = getBundleName(BUNDLE_PREFIX, BUNDLE_SUFFIX_STAGING)(browserName)

  await bundlePage.setBundleStatus(bundleNameProd, 'production')
  await bundlePage.setBundleStatus(bundleNameStaging, 'staging')

  // check copy settings dialog opens and works
  await bundlePage.copySettingsDialog('staging', true)
})

test.beforeEach(async ({bundlePage, browserName}) => {
  const bundleNameProd = getBundleName(BUNDLE_PREFIX, BUNDLE_SUFFIX_PROD)(browserName)
  const bundleNameStaging = getBundleName(BUNDLE_PREFIX, BUNDLE_SUFFIX_STAGING)(browserName)

  await bundlePage.goto()
  await bundlePage.createBundle(bundleNameProd)
  await bundlePage.createBundle(bundleNameStaging)
})

test.afterEach(async ({bundlePage, browserName}) => {
  const bundleNameProd = getBundleName(BUNDLE_PREFIX, BUNDLE_SUFFIX_PROD)(browserName)
  const bundleNameStaging = getBundleName(BUNDLE_PREFIX, BUNDLE_SUFFIX_STAGING)(browserName)

  // CLEANUP: unset statuses
  await bundlePage.unsetBundleStatus(bundleNameProd, 'production')
  await bundlePage.unsetBundleStatus(bundleNameStaging, 'staging')
  await bundlePage.deleteBundle(bundleNameProd)
  await bundlePage.deleteBundle(bundleNameStaging)
})
