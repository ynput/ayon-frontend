// Need to use the React-specific entry point to allow generating React hooks
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { graphqlRequestBaseQuery } from '@rtk-query/graphql-request-base-query'
import type { FetchArgs } from '@reduxjs/toolkit/query'
import { GraphQLClient } from 'graphql-request'

// Util function
export const buildOperations = (ids: string[], type: string, data: any) =>
  ids.map((id) => ({
    type: 'update',
    entityType: type,
    entityId: id,
    data,
  }))

const tagTypes = [
  'accessGroup',
  'addonList',
  'addonSettings',
  'addonSettingsList',
  'addonSettingsOverrides',
  'addonSettingsSchema',
  'anatomyPresets',
  'attribute',
  'activity',
  'entityActivities',
  'branch',
  'bundleList',
  'connections',
  'customRoots',
  'dependencyPackageList',
  'entity',
  'entities',
  'folder',
  'hierarchy',
  'info',
  'installerList',
  'login',
  'product',
  'project',
  'projectAddons',
  'projects',
  'secrets',
  'session',
  'settingsAddons',
  'siteRoots',
  'siteSettings',
  'siteSettingsSchema',
  'tag',
  'task',
  'team',
  'user',
  'version',
  'entitiesVersions',
  'workfile',
  'kanban',
  'kanBanTask',
  'detail',
  'marketAddon',
  'inbox',
  'service',
]

const prepareHeaders = (headers: any) => {
  const storedAccessToken = localStorage.getItem('accessToken')
  if (storedAccessToken) {
    headers.set('Authorization', `Bearer ${storedAccessToken}`)
  }
  // @ts-ignore
  headers.set('X-Sender', window.senderId)

  return headers
}

const createBaseQueryREST = (baseUrl: string) =>
  fetchBaseQuery({
    prepareHeaders: prepareHeaders,
    baseUrl: baseUrl,
  })

// check for 401 and redirect to login
const wrappedBaseQuery = (baseUrl: string) => {
  return async (args: string | FetchArgs, api: any, extraOptions: {}) => {
    try {
      const result = await createBaseQueryREST(baseUrl)(args, api, extraOptions)

      const url = typeof args === 'string' ? args : args.url

      if (result.error?.status === 401 && !url.includes('connect') && !url.startsWith('/login')) {
        window.location.href = '/login'
      }
      return result
    } catch (error) {
      console.error('Base query error:', error)
      throw error
    }
  }
}

// legacy api that covers REST and GraphQL
export const RestAPI = createApi({
  reducerPath: 'restApi',
  baseQuery: wrappedBaseQuery('/'),
  endpoints: () => ({}),
  tagTypes,
})

export const client = new GraphQLClient(`${window.location.origin}/graphql`)

// Define the GraphQL API
export const GraphQL = createApi({
  reducerPath: 'graphqlApi',
  baseQuery: graphqlRequestBaseQuery({
    prepareHeaders: prepareHeaders,
    url: '/graphql',
    // @ts-ignore
    client: client,
  }),
  endpoints: () => ({}),
  tagTypes,
})
