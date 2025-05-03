import type { AddonList } from '@shared/api'
import { api } from '@api/rest/services'

const enhancedServicesApi = api.enhanceEndpoints({
  endpoints: {
    listServices: {
      providesTags: () => ['service'],
    },
    listHosts: {
      providesTags: () => ['service'],
    },
  },
})

export const getServicesApi = enhancedServicesApi.injectEndpoints({
  endpoints: (build) => ({
    getServiceAddons: build.query({
      query: () => ({
        url: '/api/addons?details=1',
        method: 'GET',
      }),
      transformResponse: (result: AddonList) =>
        result?.addons?.filter((a) => {
          return Object.keys(a.versions).some((v) => {
            return Object.keys(a.versions[v].services || []).length
          })
        }),
      providesTags: () => ['addon'],
    }),
  }),
  overrideExisting: true,
})

export const { useListServicesQuery, useGetServiceAddonsQuery, useListHostsQuery } = getServicesApi
