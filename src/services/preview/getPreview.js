import api from '@api'
import { PREVIEW_VERSIONS_QUERY, PREVIEW_QUERY } from './previewQueries'

const getInbox = api.injectEndpoints({
  endpoints: (build) => ({
    // get all versions for a specific version id
    getPreview: build.query({
      query: ({ versionIds = [], projectName }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: PREVIEW_QUERY,
          variables: { versionIds, projectName },
        },
        validateStatus: (response, result) => response.status === 200 && !result?.errors?.length,
      }),
      transformErrorResponse: (error) => error?.data?.errors?.[0]?.message,
      transformResponse: (response) =>
        response?.data?.project?.versions?.edges?.map(({ node }) => node),
    }),
    // get all versions for a specific version id
    getPreviewVersions: build.query({
      query: ({ productIds = [], projectName }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: PREVIEW_VERSIONS_QUERY,
          variables: { productIds, projectName },
        },
        validateStatus: (response, result) => response.status === 200 && !result?.errors?.length,
      }),
      transformErrorResponse: (error) => error?.data?.errors?.[0]?.message,
      transformResponse: (response) =>
        response?.data?.project?.versions?.edges?.map(({ node }) => node),
      providesTags: (result = []) => [
        { type: 'preview', id: 'LIST' },
        ...result.map(({ id }) => ({ type: 'preview', id })),
        ...result.map(({ id }) => ({ type: 'entity', id })),
      ],
    }),
  }),
})

export const { useGetPreviewQuery, useGetPreviewVersionsQuery } = getInbox
