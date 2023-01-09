import { ayonApi, buildOperations } from './ayon'

const updateEntitiesDetails = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    updateEntitiesDetails: build.mutation({
      query: ({ projectName, type, patches, data, ids }) => ({
        url: `/api/projects/${projectName}/operations`,
        method: 'POST',
        body: {
          operations: buildOperations(ids || patches.map((p) => p.id), type, data),
        },
      }),
      async onQueryStarted({ projectName, type, patches }, { dispatch, queryFulfilled }) {
        if (!patches) return

        const patchResult = dispatch(
          ayonApi.util.updateQueryData(
            'getEntitiesDetails',
            { projectName, ids: patches.map((p) => p.id), type },
            (draft) => {
              Object.assign(
                draft,
                patches.map((p) => ({ node: p })),
              )
            },
          ),
        )
        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },
      invalidatesTags: (result, error, { type, ids, patches }) =>
        ids ? ids.flatMap((id) => [{ type, id }]) : patches.flatMap(({ id }) => [{ type, id }]),
    }),
  }),
})

export const { useUpdateEntitiesDetailsMutation } = updateEntitiesDetails
