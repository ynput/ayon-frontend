import { ayonApi } from '../ayon'
import queryUpload from '../queryUpload'

const updateAddons = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    uploadAddons: build.mutation({
      queryFn: (arg, api) =>
        queryUpload(arg, api, { endpoint: '/api/addons/install', method: 'post' }),
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
  }), // endpoints
})

export const { useUploadAddonsMutation, useDeleteAddonsMutation, useDeleteAddonVersionsMutation } =
  updateAddons
