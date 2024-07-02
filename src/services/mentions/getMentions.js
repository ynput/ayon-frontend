import api from '@api'

const getMentions = api.injectEndpoints({
  endpoints: (build) => ({
    getMentionSuggestions: build.query({
      query: ({ projectName, entityIds, entityType }) => ({
        url: `/api/projects/${projectName}/suggest`,
        method: 'POST',
        body: {
          entityType,
          entityId: entityIds[0],
        },
      }),
    }),
    overrideExisting: true,
  }),
})

export const { useGetMentionSuggestionsQuery } = getMentions
