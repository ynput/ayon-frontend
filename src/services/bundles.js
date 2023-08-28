import { ayonApi } from './ayon'

const getBundles = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getBundleList: build.query({
      query: ({ archived = false }) => ({
        url: `/api/bundles?archived=${archived}`,
      }),
      transformResponse: (res) => res.bundles,
      providesTags: () => [{ type: 'bundleList' }],
    }),

    deleteBundle: build.mutation({
      query: ({ name }) => ({
        url: `/api/bundles/${name}`,
        method: 'DELETE',
      }),
      // optimisticUpdate bundleList to remove deleted bundle
      // eslint-disable-next-line no-unused-vars
      onQueryStarted: async ({ name, archived = true }, { dispatch, queryFulfilled }) => {
        const patchResult = dispatch(
          ayonApi.util.updateQueryData('getBundleList', { archived }, (draft) => {
            const bundleIndex = draft.findIndex((bundle) => bundle.name === name)
            draft.splice(bundleIndex, 1)
          }),
        )
        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },

      // eslint-disable-next-line no-unused-vars
      invalidatesTags: (result, error, id) => [
        { type: 'bundleList' },
        { type: 'addonList' },
        { type: 'addonSettingsList' },
      ],
    }),

    promoteBundle: build.mutation({
      query: ({ name }) => ({
        url: `/api/bundles/${name}`,
        method: 'POST',
        body: { action: 'promote' },
      }),
      // eslint-disable-next-line no-unused-vars
      invalidatesTags: (result, error, id) => [
        { type: 'bundleList' },
        { type: 'addonList' },
        { type: 'addonSettingsList' },
        { type: 'addonSettings' },
        { type: 'addonSettingsOverrides' },
      ],
    }),

    createBundle: build.mutation({
      query: ({ data }) => ({
        url: `/api/bundles`,
        method: 'POST',
        body: data,
      }),
      // optimisticUpdate bundleList to add new bundle
      // TURNED OFF: having the lag is good user feedback
      // onQueryStarted: async ({ archived = false, data }, { dispatch, queryFulfilled }) => {
      //   const patchResult = dispatch(
      //     ayonApi.util.updateQueryData('getBundleList', { archived }, (draft) => {
      //       draft.push(data)
      //     }),
      //   )
      //   try {
      //     await queryFulfilled
      //   } catch {
      //     patchResult.undo()
      //   }
      // },
      // eslint-disable-next-line no-unused-vars
      invalidatesTags: (result, error, id) => [
        { type: 'bundleList' },
        { type: 'addonList' },
        { type: 'addonSettingsList' },
      ],
    }),

    updateBundle: build.mutation({
      query: ({ name, data }) => ({
        url: `/api/bundles/${name}`,
        method: 'PATCH',
        body: data,
      }),
      // optimisticUpdate bundleList to update bundle
      // eslint-disable-next-line no-unused-vars
      onQueryStarted: async ({ name, archived = true, patch }, { dispatch, queryFulfilled }) => {
        const patchResult = dispatch(
          ayonApi.util.updateQueryData('getBundleList', { archived }, (draft) => {
            if (!patch) throw new Error('patch not found')
            const bundleIndex = draft.findIndex((bundle) => bundle.name === name)
            if (bundleIndex === -1) throw new Error('bundle not found')
            draft[bundleIndex] = patch
          }),
        )
        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },
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
  useLazyGetBundleListQuery,
  useDeleteBundleMutation,
  useCreateBundleMutation,
  useUpdateBundleMutation,
  usePromoteBundleMutation,
} = getBundles
