import api from '@api'

const updateAttributes = api.injectEndpoints({
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
      invalidatesTags: () => ['attribute'],
    }),
  }),
  overrideExisting: true,
})

export const { useUpdateAttributesMutation } = updateAttributes
