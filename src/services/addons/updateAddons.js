import { ayonApi } from '../ayon'
import queryUpload from '../queryUpload'

const updateAddons = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    uploadAddons: build.mutation({
      queryFn: (arg, api) =>
        queryUpload(arg, api, { endpoint: '/api/addons/install', method: 'post' }),
    }),
  }), // endpoints
})

export const { useUploadAddonsMutation } = updateAddons
