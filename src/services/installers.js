import { ayonApi } from './ayon'
import queryUpload from './queryUpload'

const getInstallers = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getInstallerList: build.query({
      query: () => ({
        url: `/api/desktop/installers`,
      }),
      transformResponse: (res) => res.installers,
      providesTags: () => [{ type: 'installerList' }],
    }),
    // create installer
    createInstaller: build.mutation({
      query: ({ data, endPoint = 'installers' }) => ({
        url: `/api/desktop/${endPoint}`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['installerList', 'dependencyPackageList'],
    }),
    uploadInstallers: build.mutation({
      queryFn: (arg, api) => queryUpload(arg, api, { endpoint: '/api/desktop/installers' }),
    }),
  }), // endpoints
})

export const { useGetInstallerListQuery, useCreateInstallerMutation, useUploadInstallersMutation } =
  getInstallers
