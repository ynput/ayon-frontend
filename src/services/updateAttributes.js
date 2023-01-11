import { ayonApi } from './ayon'

const updateAttributes = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    updateAttributes: build.mutation({
      query: ({ attributes, deleteMissing }) => ({
        url: '/api/attributes',
        method: 'PUT',
        body: {
          attributes,
          deleteMissing,
        },
      }),
    }),
  }),
})

export const { useUpdateAttributesMutation } = updateAttributes
