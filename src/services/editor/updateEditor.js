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
    }),
  }),
})

export const { useUpdateEditorMutation } = updateEditor
