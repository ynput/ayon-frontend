import { ayonApi } from './ayon'

const getInstallers = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getInstallerList: build.query({
      query: () => ({
        url: `/api/desktop/installers`,
      }),
      transformResponse: (res) => res.installers,
      providesTags: () => [{ type: 'bundleList' }],
    }),
  }), // endpoints
})

export const { useGetInstallerListQuery } = getInstallers
