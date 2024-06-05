import { ayonApi } from '../ayon'

const getMentions = ayonApi.injectEndpoints({
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
  }),
})

export const { useGetMentionSuggestionsQuery } = getMentions
