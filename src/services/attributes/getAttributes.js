import api from '@api'

const getAttributes = api.rest.injectEndpoints({
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
  overrideExisting: true,
})

export const { useGetAttributesQuery } = getAttributes
