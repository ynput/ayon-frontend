import api from './getInstallers'
import queryUpload from '../queryUpload'

const updateInstallersApi = api.enhanceEndpoints({
  endpoints: {
    createInstaller: {
      invalidatesTags: ['installerList'],
    },
  },
})

const updateInstallersApiInjected = updateInstallersApi.injectEndpoints({
  endpoints: (build) => ({
    uploadInstallers: build.mutation({
      queryFn: (arg, api) => queryUpload(arg, api, { endpoint: '/api/desktop/installers' }),
    }),
  }),
})

export const { useCreateInstallerMutation, useUploadInstallersMutation } =
  updateInstallersApiInjected
