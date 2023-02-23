// Need to use the React-specific entry point to allow generating React hooks
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import short from 'short-uuid'

// Util function
export const buildOperations = (ids, type, data) =>
  ids.map((id) => ({
    type: 'update',
    entityType: type,
    entityId: id,
    data,
  }))

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
  tagTypes: [
    'folder',
    'task',
    'version',
    'subset',
    'tag',
    'project',
    'projects',
    'attribute',
    'user',
    'workfile',
    'anatomyPresets',
    'hierarchy',
    'branch',
  ],
  endpoints: () => ({}),
})
