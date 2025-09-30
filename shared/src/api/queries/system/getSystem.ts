import { systemApi } from '@shared/api/generated'

const getSystemApi = systemApi.enhanceEndpoints({
  endpoints: {
    getSiteInfo: {
      providesTags: (result) =>
        result
          ? [
              'info',
              ...(result.attributes || []).map((attr) => ({
                type: 'attribute' as const,
                id: attr.name,
              })),
            ]
          : ['info'],
    },
    listFrontendModules: {
      providesTags: ['info'],
    },
  },
})

export const { useGetSiteInfoQuery, useLazyGetSiteInfoQuery, useListFrontendModulesQuery } =
  getSystemApi
export { getSystemApi as systemQueries }
