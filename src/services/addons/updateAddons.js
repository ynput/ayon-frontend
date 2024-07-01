import { ayonApi } from '../ayon'
import queryUpload from '../queryUpload'

const updateAddons = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    uploadAddons: build.mutation({
      queryFn: (arg, api) =>
        queryUpload(arg, api, { endpoint: '/api/addons/install', method: 'post' }),
      invalidatesTags: ['info', 'bundleList', 'addonList', 'addonSettingsList', 'marketAddon'],
    }),
    // delete multiple addons (and all versions) at once
    deleteAddons: build.mutation({
      async queryFn({ addons = [] }, _queryApi, _extraOptions, fetchWithBaseQuery) {
        const deletePromises = addons
          .filter((addon) => addon.name) // skip addons with null name
          .map((addon) =>
            fetchWithBaseQuery({
              // delete each valid addon
              url: `/api/addons/${addon.name}`,
              method: 'DELETE',
            }),
          )

        const responses = await Promise.all(deletePromises) // wait for all delete operations to complete
        return responses
      },
      invalidatesTags: ['addonList'],
    }),
    // delete multiple addon versions at once
    deleteAddonVersions: build.mutation({
      async queryFn({ addons = [] }, _queryApi, _extraOptions, fetchWithBaseQuery) {
        const deletePromises = addons
          .filter((addon) => addon.name && addon.version) // skip addons with null name or version
          .map((addon) =>
            fetchWithBaseQuery({
              // delete each valid addon
              url: `/api/addons/${addon.name}/${addon.version}`,
              method: 'DELETE',
            }),
          )

        const responses = await Promise.all(deletePromises) // wait for all delete operations to complete
        return responses
      },
      invalidatesTags: ['addonList'],
    }),
    downloadAddons: build.mutation({
      queryFn: async (arg, api) => {
        const { addons = [] } = arg || {}

        try {
          // first, upload all addons
          const addonsRes = await queryUpload({ files: addons }, api, {
            endpoint: '/api/addons/install',
            method: 'post',
            fromUrl: true,
          })

          // add eventIds to array
          const eventIds = [...(addonsRes.data || [])]

          return { data: eventIds, error: addonsRes.error }
        } catch (error) {
          console.error(error)
          return { error: error?.response?.data?.detail || 'Download addon errors' }
        }
      },
      invalidatesTags: [
        'info',
        'bundleList',
        'addonList',
        'addonSettingsList',
        'installerList',
        'dependencyPackageList',
      ],
    }),
  }), // endpoints
})

export const {
  useUploadAddonsMutation,
  useDeleteAddonsMutation,
  useDeleteAddonVersionsMutation,
  useDownloadAddonsMutation,
} = updateAddons
