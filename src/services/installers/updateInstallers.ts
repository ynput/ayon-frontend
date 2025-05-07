import api from './getInstallers'
import queryUpload from '../queryUpload'

const updateInstallersApi = api.enhanceEndpoints({
  endpoints: {
    createInstaller: {
      invalidatesTags: ['installerList'],
    },
    deleteInstallerFile: {
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

export const {
  useCreateInstallerMutation,
  useUploadInstallersMutation,
  useDeleteInstallerFileMutation,
} = updateInstallersApiInjected
export { updateInstallersApiInjected as installersQueries }
