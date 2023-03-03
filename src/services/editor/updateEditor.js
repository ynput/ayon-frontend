import { ayonApi } from '../ayon'
import { nodesUpdated } from '/src/features/editor'

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
      invalidatesTags: (result, error, { updates }) => [
        ...updates.map((op) => [{ type: 'branch', id: op.id }]),
        'hierarchy',
      ],
      async onCacheEntryAdded({ updates }, { cacheDataLoaded, dispatch }) {
        try {
          // wait for the initial query to resolve before proceeding
          await cacheDataLoaded

          const updated = []
          const deleted = []

          // create object of updated/new branches
          for (const op of updates) {
            if (op.type === 'delete') {
              deleted.push(op.id)
            } else {
              updated.push(op.patch)
            }
          }
          // add new branches to redux editor slice
          dispatch(nodesUpdated({ updated: updated, deleted }))
        } catch (error) {
          console.error(error)
        }
      },
    }),
  }),
})

export const { useUpdateEditorMutation } = updateEditor
