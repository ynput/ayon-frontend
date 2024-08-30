// we continue to use the enhanced bundles api from getBundles.js
import api from './getBundles'

const updateBundles = api.injectEndpoints({
  endpoints: (build) => ({
    deleteBundle: build.mutation({
      query: ({ name }) => ({
        url: `/api/bundles/${name}`,
        method: 'DELETE',
      }),
      // optimisticUpdate bundleList to remove deleted bundle
      // eslint-disable-next-line no-unused-vars
      onQueryStarted: async ({ name, archived = true }, { dispatch, queryFulfilled }) => {
        const patchResult = dispatch(
          api.util.updateQueryData('listBundles', { archived }, (draft) => {
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
      query: ({ name, force = true }) => ({
        url: `/api/bundles/${name}?force=${force}`,
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
        { type: 'marketAddon' },
      ],
    }),

    createBundle: build.mutation({
      query: ({ data, force = false }) => ({
        url: `/api/bundles?force=${force}`,
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
      query: ({ name, data, force = true }) => ({
        url: `/api/bundles/${name}?force=${force}`,
        method: 'PATCH',
        body: data,
      }),
      // optimisticUpdate bundleList to update bundle
      // eslint-disable-next-line no-unused-vars
      onQueryStarted: async ({ name, archived = true, patch }, { dispatch, queryFulfilled }) => {
        const patchResult = dispatch(
          api.util.updateQueryData('listBundles', { archived }, (draft) => {
            if (!patch) return
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
        { type: 'marketAddon' },
      ],
    }),
  }), // endpoints
  overrideExisting: true,
})

export const {
  useDeleteBundleMutation,
  useCreateBundleMutation,
  useUpdateBundleMutation,
  usePromoteBundleMutation,
} = updateBundles
