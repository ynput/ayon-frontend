import { servicesApi } from '@shared/api'
import type { AddonList } from '@shared/api'

const enhancedServicesApi = servicesApi.enhanceEndpoints({
  endpoints: {
    listServices: {
      providesTags: () => ['service'],
    },
    listHosts: {
      providesTags: () => ['service'],
    },
  },
})

const getServicesApi = enhancedServicesApi.injectEndpoints({
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
export default getServicesApi
