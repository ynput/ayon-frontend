// Need to use the React-specific entry point to allow generating React hooks
import { createApi } from '@reduxjs/toolkit/query/react'
import { graphqlRequestBaseQuery } from '@rtk-query/graphql-request-base-query'
import { gql } from 'graphql-request'
import short from 'short-uuid'

// Define a service using a base URL and expected endpoints
export const ayonApi = createApi({
  reducerPath: 'ayonApi',
  baseQuery: graphqlRequestBaseQuery({
    url: '/graphql',
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
      query: ({ name }) => ({
        document: gql`
          query getProject($name: String!) {
            project(name: $name) {
              name
            }
          }
        `,
        variables: { name },
      }),
    }),
  }),
})

// Export hooks for usage in function components, which are
// auto-generated based on the defined endpoints
export const { useGetTagsByTypeQuery } = ayonApi
