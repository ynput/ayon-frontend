import { api } from '@api/rest/bundles'

const getBundles = api.enhanceEndpoints({
  endpoints: {
    listBundles: {
      providesTags: () => [{ type: 'bundleList' }],
    },
    checkBundleCompatibility: {},
  },
})

export const { useListBundlesQuery, useLazyListBundlesQuery, useCheckBundleCompatibilityQuery } =
  getBundles

export default getBundles
