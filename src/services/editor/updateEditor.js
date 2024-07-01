import api from '@api'

const updateEditor = api.injectEndpoints({
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
            force: op?.force,
          })),
        },
      }),
    }),
    overrideExisting: true,
  }),
})

export const { useUpdateEditorMutation } = updateEditor
