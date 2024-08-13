import { getBundleName, bundleTest as test} from './fixtures/bundlePage'

test('create/delete bundle', async ({bundlePage, browserName}) => {
  const bundleName= getBundleName('test_bundle')(browserName)
  await bundlePage.createBundle(bundleName)
  await bundlePage.deleteBundle(bundleName)
})