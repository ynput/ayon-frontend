// Need to use the React-specific entry point to allow generating React hooks
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// Util function
export const buildOperations = (ids, type, data) =>
  ids.map((id) => ({
    type: 'update',
    entityType: type,
    entityId: id,
    data,
  }))

const baseQuery = fetchBaseQuery({
  prepareHeaders: (headers) => {
    const storedAccessToken = localStorage.getItem('accessToken')
    if (storedAccessToken) {
      // headers.set('Authorization', `Bearer ${storedAccessToken}`)
    }
    headers.set('X-Sender', window.senderId)

    return headers
  },
})

// check for 401 and redirect to login
const wrappedBaseQuery = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions)

  if (
    result.error?.status === 401 &&
    !args.url.includes('connect') &&
    !args.url.startsWith('/login')
  ) {
    window.location.href = '/login'
  }
  return result
}

// Define a service using a base URL and expected endpoints
export const ayonApi = createApi({
  reducerPath: 'ayonApi',
  baseQuery: wrappedBaseQuery,
  tagTypes: [
    'accessGroup',
    'addonList',
    'addonSettings',
    'addonSettingsList',
    'addonSettingsOverrides',
    'addonSettingsSchema',
    'anatomyPresets',
    'attribute',
    'branch',
    'bundleList',
    'connections',
    'customRoots',
    'dependencyPackageList',
    'entity',
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
    'workfile',
    'kanBanTask',
    'detail',
    'productsVersion',
    'marketAddon',
  ],
  endpoints: () => ({}),
})
