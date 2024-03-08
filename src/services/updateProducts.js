import { ayonApi, buildOperations } from './ayon'

const updateProducts = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    updateProducts: build.mutation({
      query: ({ projectName, data, ids }) => ({
        url: `/api/projects/${projectName}/operations`,
        method: 'POST',
        body: {
          operations: buildOperations(ids, 'product', data),
        },
      }),
      async onQueryStarted(
        { projectName, patches, versionOverrides, focusedFolders },
        { dispatch, queryFulfilled },
      ) {
        if (!patches) return

        const patchResult = dispatch(
          ayonApi.util.updateQueryData(
            'getProductList',
            { projectName, ids: focusedFolders, versionOverrides },
            (draft) => {
              Object.assign(draft, patches)
            },
          ),
        )
        try {
          const result = await queryFulfilled

          if (result.data?.success === false) {
            throw new Error('Failed to update products')
          }
        } catch {
          patchResult.undo()
        }
      },
    }),
  }),
})

export const { useUpdateProductsMutation } = updateProducts
