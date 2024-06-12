import { ayonApi } from '../ayon'

const getServices = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getServices: build.query({
      query: () => ({
        url: '/api/services',
        method: 'GET',
      }),
      providesTags: () => ['service'],
      transformResponse: (result) => result?.services,
    }),
    getServiceAddons: build.query({
      query: () => ({
        url: '/api/addons?details=1',
        method: 'GET',
      }),
      transformResponse: (result) =>
        result?.addons?.filter((a) => {
          return Object.keys(a.versions).some((v) => {
            return Object.keys(a.versions[v].services || []).length
          })
        }),
      providesTags: () => ['addon'],
    }),
    getServiceHosts: build.query({
      query: () => ({
        url: '/api/hosts',
        method: 'GET',
      }),
      transformResponse: (result) => result?.hosts,
    }),
  }),
})

export const { useGetServicesQuery, useGetServiceAddonsQuery, useGetServiceHostsQuery } =
  getServices
