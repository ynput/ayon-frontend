import { ayonApi, buildOperations } from './ayon'

const updateSubsets = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    updateSubsets: build.mutation({
      query: ({ projectName, data, ids }) => ({
        url: `/api/projects/${projectName}/operations`,
        method: 'POST',
        body: {
          operations: buildOperations(ids, 'subset', data),
        },
      }),
      async onQueryStarted(
        { projectName, patches, versionOverrides, focusedFolders },
        { dispatch, queryFulfilled },
      ) {
        if (!patches) return

        const patchResult = dispatch(
          ayonApi.util.updateQueryData(
            'getSubsetsList',
            { projectName, ids: focusedFolders, versionOverrides },
            (draft) => {
              Object.assign(draft, patches)
            },
          ),
        )
        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },
    }),
  }),
})

export const { useUpdateSubsetsMutation } = updateSubsets
