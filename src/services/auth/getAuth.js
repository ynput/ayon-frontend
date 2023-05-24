import { ayonApi } from '../ayon'

const getAuth = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getInfo: build.query({
      query: () => ({
        url: '/api/info',
      }),
      providesTags: ['info'],
    }),
  }),
})

//

export const { useGetInfoQuery, useLazyGetInfoQuery } = getAuth
