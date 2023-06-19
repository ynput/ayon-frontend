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

    deleteBundle: build.mutation({
      query: (id) => ({
        url: `/api/desktop/bundles/${id}`,
        method: 'DELETE',
      }),
      // eslint-disable-next-line no-unused-vars
      invalidatesTags: (result, error, id) => [{ type: 'bundleList' }],
    }),

    createBundle: build.mutation({
      query: (data) => ({
        url: `/api/desktop/bundles`,
        method: 'POST',
        body: data,
      }),
      // eslint-disable-next-line no-unused-vars
      invalidatesTags: (result, error, id) => [{ type: 'bundleList' }],
    }),
  }), // endpoints
})

export const { useGetBundleListQuery, useDeleteBundleMutation, useCreateBundleMutation } =
  getBundles
