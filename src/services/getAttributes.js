import { ayonApi } from './ayon'

const getAttributes = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getAttributes: build.query({
      query: () => ({
        url: '/api/attributes',
      }),
      transformResponse: (res) => res.attributes,
    }),
  }),
})

export const { useGetAttributesQuery } = getAttributes
