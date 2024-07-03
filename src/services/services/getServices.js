import api from '@api'

const getServices = api.injectEndpoints({
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
  overrideExisting: true,
})

export const { useGetServicesQuery, useGetServiceAddonsQuery, useGetServiceHostsQuery } =
  getServices
