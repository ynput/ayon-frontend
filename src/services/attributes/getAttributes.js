import { ayonApi } from '../ayon'

const getAttributes = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getAttributes: build.query({
      query: () => ({
        url: '/api/attributes',
      }),
      transformResponse: (res) => res.attributes,
      providesTags: (result) =>
        result
          ? [...result.map(({ name }) => ({ type: 'attribute', id: name })), 'attribute']
          : ['attribute'],
    }),
  }),
})

export const { useGetAttributesQuery } = getAttributes
