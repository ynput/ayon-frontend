import { ayonApi } from '../ayon'

const getBundles = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getBundleList: build.query({
      query: ({ archived }) => ({
        url: `/api/bundles?archived=${archived || false}`,
      }),
      transformResponse: (res) => res.bundles,
      providesTags: () => [{ type: 'bundleList' }],
    }),
  }), // endpoints
})

export const {
  useGetBundleListQuery,
  useLazyGetBundleListQuery,
  useDeleteBundleMutation,
  useCreateBundleMutation,
  useUpdateBundleMutation,
  usePromoteBundleMutation,
} = getBundles
