import { ayonApi } from '../ayon'

const updateEditor = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    updateEditor: build.mutation({
      query: ({ projectName, updates = [] }) => ({
        url: `/api/projects/${projectName}/operations`,
        method: 'POST',
        body: {
          operations: updates.map((op) => ({
            data: op?.data,
            entityId: op?.entityId,
            entityType: op?.entityType,
            id: op?.id,
            type: op?.type,
          })),
        },
      }),
      invalidatesTags: (result, error, { updates }) =>
        updates.map((op) => ({ type: 'branch', id: op.id })),
      async onQueryStarted({ projectName, updates = [] }, { dispatch, queryFulfilled }) {
        if (!updates) return

        // now patch in new branches into rootData
        const patchResult = dispatch(
          ayonApi.util.updateQueryData('getEditorRoot', { projectName }, (draft) => {
            const updatedBranches = {}

            // create object of updated/new branches
            for (const op of updates) {
              if (op.type === 'delete') {
                delete draft[op.entityId]
              } else {
                updatedBranches[op.entityId] = op.patch
              }
            }

            console.log('patching root data')
            console.log(updatedBranches)
            Object.assign(draft, { ...draft, ...updatedBranches })
          }),
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

export const { useUpdateEditorMutation } = updateEditor
