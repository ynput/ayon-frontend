import { systemApi } from '@shared/api/generated'

const getSystemApi = systemApi.enhanceEndpoints({
  endpoints: {
    getSiteInfo: {
      providesTags: ['info'],
    },
    listFrontendModules: {
      providesTags: ['info'],
    },
  },
})

export const { useGetSiteInfoQuery, useLazyGetSiteInfoQuery, useListFrontendModulesQuery } =
  getSystemApi
export { getSystemApi as systemQueries }
