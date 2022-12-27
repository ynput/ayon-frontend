// Need to use the React-specific entry point to allow generating React hooks
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import short from 'short-uuid'

// Define a service using a base URL and expected endpoints
export const ayonApi = createApi({
  reducerPath: 'ayonApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
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
    getInfo: builder.query({ query: () => '/info' }),
  }),
})

// Export hooks for usage in function components, which are
// auto-generated based on the defined endpoints
export const { useGetTagsByTypeQuery, useGetInfoQuery } = ayonApi
