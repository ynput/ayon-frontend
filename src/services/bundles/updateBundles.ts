// we continue to use the enhanced bundles api from getBundles.js
import api from './getBundles'

const enhancedUpdateBundles = api.enhanceEndpoints({
  endpoints: {
    migrateSettingsByBundle: {
      invalidatesTags: () => [
        { type: 'addonSettings' },
        { type: 'addonSettingsOverrides' },
        { type: 'addonSettingsList' },
      ],
    },
  },
})

// Rest of non converted queries that will eventually be converted to use the enhanced api
const updateBundles = enhancedUpdateBundles.injectEndpoints({
  endpoints: (build) => ({
    deleteBundle: build.mutation({
      query: ({ name }) => ({
        url: `/api/bundles/${name}`,
        method: 'DELETE',
      }),

      // eslint-disable-next-line no-unused-vars
      invalidatesTags: () => [
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
      invalidatesTags: () => [
        { type: 'bundleList' },
        { type: 'addonList' },
        { type: 'addonSettingsList' },
        { type: 'addonSettings' },
        { type: 'addonSettingsOverrides' },
        { type: 'marketAddon' },
      ],
    }),

    createBundle: build.mutation({
      query: ({ data, force = false, settingsFromBundle = null, settingsFromVariant = null }) => {
        const queryParameters = new URLSearchParams()
        if (force) queryParameters.append('force', force)
        if (settingsFromBundle) queryParameters.append('settingsFromBundle', settingsFromBundle)
        if (settingsFromVariant) queryParameters.append('settingsFromVariant', settingsFromVariant)

        return {
          url: `/api/bundles?${queryParameters.toString()}`,
          method: 'POST',
          body: data,
        }
      },
      // eslint-disable-next-line no-unused-vars
      invalidatesTags: () => [
        { type: 'bundleList' },
        { type: 'addonList' },
        { type: 'addonSettingsList' },
        // TODO: invalidate settings
        { type: 'addonSettings' },
        { type: 'addonSettingsOverrides' },
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
            if (!patch || !draft?.bundles) return
            const bundleIndex = draft.bundles.findIndex((bundle) => bundle.name === name)
            if (bundleIndex === -1) throw new Error('bundle not found')
            draft.bundles[bundleIndex] = patch
          }),
        )
        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },
      // eslint-disable-next-line no-unused-vars
      invalidatesTags: () => [
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
  useUpdateBundleMutation, // migrated to enhanced api
  usePromoteBundleMutation,
  useMigrateSettingsByBundleMutation,
} = updateBundles
export { updateBundles as bundlesQueries }
