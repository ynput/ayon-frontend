import { ayonApi } from './ayon'

const getBundles = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getBundleList: build.query({
      query: () => ({
        url: `/api/desktop/bundles`,
      }),
      transformResponse: (res) => res.bundles,
      providesTags: () => [{ type: 'bundleList' }],
    }),
  }), // endpoints
})

export const { useGetBundleListQuery } = getBundles
