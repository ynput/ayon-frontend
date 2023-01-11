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
      // TODO get optimistic updates working
      //   async onQueryStarted({ patches }, { dispatch, queryFulfilled }) {
      //     if (!patches) return

      //     const patchResult = dispatch(
      //       ayonApi.util.updateQueryData('getAttributes', {}, (draft) => {
      //         Object.assign(draft, patches)
      //       }),
      //     )
      //     try {
      //       await queryFulfilled
      //     } catch {
      //       patchResult.undo()
      //     }
      //   },
      invalidatesTags: (result, error, { patches }) => [
        patches.map(({ name }) => ({ type: 'attribute', id: name })),
        'attribute',
      ],
    }),
  }),
})

export const { useUpdateAttributesMutation } = updateAttributes
