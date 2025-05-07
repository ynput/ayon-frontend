import { bundlesApi } from '@shared/api'

const getBundles = bundlesApi.enhanceEndpoints({
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
