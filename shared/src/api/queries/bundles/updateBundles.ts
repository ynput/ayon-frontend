// we continue to use the enhanced bundles api from getBundles.js
import api from './getBundles'
import { projectsApi } from '@shared/api/generated'

const enhancedUpdateBundles = api.enhanceEndpoints({
  endpoints: {
    migrateSettingsByBundle: {
      invalidatesTags: () => [
        { type: 'addonSettings' },
        { type: 'addonSettingsOverrides' },
        { type: 'addonSettingsList' },
      ],
    },
    updateBundle: {
      // optimisticUpdate bundleList to update bundle
      onQueryStarted: async (
        // @ts-expect-error: archived and patch are not part of the api args, but we need them for the optimistic update
        { bundleName, archived = true, patch },
        { dispatch, queryFulfilled },
      ) => {
        const patchResult = dispatch(
          api.util.updateQueryData('listBundles', { archived }, (draft) => {
            if (!patch || !draft?.bundles) return
            const bundleIndex = draft.bundles.findIndex((bundle) => bundle.name === bundleName)
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
    },
  },
})

const enhancedProjectsApi = projectsApi.enhanceEndpoints({
  endpoints: {
    unsetProjectBundle: {
      invalidatesTags: (_result, _error, { projectName }) => [
        { type: 'bundle', id: projectName },
        { type: 'bundleList' },
        { type: 'addonSettings' },
        { type: 'addonSettingsOverrides' },
        { type: 'addonSettingsList' },
        { type: 'addonSettingsSchema' },
      ],
    },
  },
})

// NOTE: Rest of non converted queries that will eventually be converted to use the enhanced api
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
  }), // endpoints
  overrideExisting: true,
})

export const {
  useDeleteBundleMutation,
  useCreateBundleMutation,
  usePromoteBundleMutation,
  useMigrateSettingsByBundleMutation,
  useUpdateBundleMutation,
} = updateBundles

export const { useUnsetProjectBundleMutation } = enhancedProjectsApi
// useSetProjectBundleMutation

export { updateBundles as bundlesQueries }
