import { ayonApi } from './ayon'

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
  }), // endpoints
})

export const { useGetInstallerListQuery, useCreateInstallerMutation } = getInstallers
