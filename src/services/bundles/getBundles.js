import api from '@api'

const getBundles = api.rest.injectEndpoints({
  endpoints: (build) => ({
    getBundleList: build.query({
      query: ({ archived }) => ({
        url: `/api/bundles?archived=${archived || false}`,
      }),
      transformResponse: (res) => res.bundles,
      providesTags: () => [{ type: 'bundleList' }],
    }),

    // check bundle compatibility
    checkBundle: build.query({
      query: ({ bundle = {} }) => ({
        url: `/api/bundles/check`,
        method: 'POST',
        body: bundle,
      }),
      transformResponse: (res) => res,
    }),
  }), // endpoints
  overrideExisting: true,
})

export const { useGetBundleListQuery, useLazyGetBundleListQuery, useCheckBundleQuery } = getBundles
