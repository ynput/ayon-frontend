import { api } from '@api/rest/activities'
import { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type {
  SuggestEntityMentionApiArg,
  SuggestEntityMentionApiResponse,
} from '@/api/rest/activities'

const enhancedMentionsApi = api.enhanceEndpoints({
  endpoints: {
    suggestEntityMention: {},
  },
})

const injectedApi = enhancedMentionsApi.injectEndpoints({
  endpoints: (build) => ({
    getEntityMentions: build.query<SuggestEntityMentionApiResponse, SuggestEntityMentionApiArg>({
      queryFn: async (args, { dispatch }) => {
        // Use the mutation internally to get data
        const res = await dispatch(
          enhancedMentionsApi.endpoints.suggestEntityMention.initiate(args),
        )

        if (res.error) {
          return { error: res.error as FetchBaseQueryError }
        }

        return { data: res.data }
      },
    }),
  }),
})

export const { useGetEntityMentionsQuery } = injectedApi
