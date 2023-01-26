import { ayonApi } from './ayon'

const getRoles = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getRoles: build.query({
      query: () => ({
        url: '/api/roles/_',
      }),
      transformResponse: (res) => res.map((r) => r.name),
    }),
  }),
})

export const { useGetRolesQuery } = getRoles
