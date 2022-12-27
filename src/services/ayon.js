// Need to use the React-specific entry point to allow generating React hooks
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import short from 'short-uuid'

const buildTagsQuery = (type) => {
  const TAGS_QUERY = `
      query Tags($projectName: String!, $ids: [String!]!) {
          project(name: $projectName) {
            ${type}s(ids: $ids) {
                  edges {
                      node {
                          id
                          name
                          tags
                      }
                  }
              }
          }
      }
  
  `

  return TAGS_QUERY
}

// Define a service using a base URL and expected endpoints
export const ayonApi = createApi({
  reducerPath: 'ayonApi',
  baseQuery: fetchBaseQuery({
    prepareHeaders: (headers) => {
      const storedAccessToken = localStorage.getItem('accessToken')
      if (storedAccessToken) {
        // headers.common['Authorization'] = `Bearer ${storedAccessToken}`
        headers.set('Authorization', `Bearer ${storedAccessToken}`)
      }
      //   headers.common['X-Sender'] = short.generate()
      headers.set('X-Sender', short.generate())

      return headers
    },
  }),
  endpoints: (builder) => ({
    getTagsByType: builder.query({
      query: ({ type, projectName, ids }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: buildTagsQuery(type),
          variables: { projectName, ids },
        },
      }),
      transformResponse: (response, meta, { type }) =>
        response.data.project[type + 's'].edges.reduce(
          (acc, cur) => ({ ...acc, [cur.node.id]: cur.node }),
          {},
        ),
    }),
    updateTagsByType: builder.mutation({
      query: ({ projectName, operations }) => ({
        url: `/api/projects/${projectName}/operations`,
        method: 'POST',
        body: { operations },
      }),
    }),
  }),
})

// Export hooks for usage in function components, which are
// auto-generated based on the defined endpoints
export const { useGetTagsByTypeQuery, useUpdateTagsByTypeMutation } = ayonApi
