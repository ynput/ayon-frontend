import { ayonApi } from './ayon'

const getBundles = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getBundleList: build.query({
      query: () => ({
        url: `/api/bundles`,
      }),
      transformResponse: (res) => res.bundles,
      providesTags: () => [{ type: 'bundleList' }],
    }),

    deleteBundle: build.mutation({
      query: (id) => ({
        url: `/api/bundles/${id}`,
        method: 'DELETE',
      }),
      // eslint-disable-next-line no-unused-vars
      invalidatesTags: (result, error, id) => [
        { type: 'bundleList' },
        { type: 'addonList' },
        { type: 'addonSettingsList' },
      ],
    }),

    createBundle: build.mutation({
      query: (data) => ({
        url: `/api/bundles`,
        method: 'POST',
        body: data,
      }),
      // eslint-disable-next-line no-unused-vars
      invalidatesTags: (result, error, id) => [
        { type: 'bundleList' },
        { type: 'addonList' },
        { type: 'addonSettingsList' },
      ],
    }),

    updateBundle: build.mutation({
      query: ({ name, ...data }) => ({
        url: `/api/bundles/${name}`,
        method: 'PATCH',
        body: data,
      }),
      // eslint-disable-next-line no-unused-vars
      invalidatesTags: (result, error, id) => [
        { type: 'bundleList' },
        { type: 'addonList' },
        { type: 'addonSettingsList' },
      ],
    }),
  }), // endpoints
})

export const {
  useGetBundleListQuery,
  useDeleteBundleMutation,
  useCreateBundleMutation,
  useUpdateBundleMutation,
} = getBundles
