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
      invalidatesTags: (result, error, { updates }) => [
        ...updates.map((op) => [{ type: 'branch', id: op.id }]),
        'hierarchy',
      ],
    }),
  }),
})

export const { useUpdateEditorMutation } = updateEditor
