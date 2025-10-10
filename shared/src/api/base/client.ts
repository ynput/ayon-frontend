// Need to use the React-specific entry point to allow generating React hooks
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { graphqlRequestBaseQuery } from '@rtk-query/graphql-request-base-query'
import type {
  BaseQueryApi,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query'
import { GraphQLClient } from 'graphql-request'
import type {
  BaseQueryArg,
  BaseQueryError,
  BaseQueryExtraOptions,
  BaseQueryResult,
} from './baseQueryTypes'

// https://github.com/reduxjs/redux-toolkit/discussions/3161
const combineBaseQueries =
  <
    DefaultBQ extends BaseQueryFn<any, any, any, any, any>,
    CaseBQs extends {
      predicate: (arg: unknown, api: BaseQueryApi, extraOptions: unknown) => boolean
      baseQuery: BaseQueryFn<any, any, any, any, any>
    }[],
    AllBQs extends DefaultBQ | CaseBQs[number]['baseQuery'] =
      | DefaultBQ
      | CaseBQs[number]['baseQuery'],
  >(
    defaultBQ: DefaultBQ,
    ...caseBQs: CaseBQs
  ): BaseQueryFn<
    BaseQueryArg<AllBQs>,
    BaseQueryResult<AllBQs>,
    BaseQueryError<AllBQs>,
    BaseQueryExtraOptions<AllBQs>
  > =>
  (arg, api, extraOptions) => {
    for (const { predicate, baseQuery } of caseBQs) {
      if (predicate(arg, api, extraOptions)) {
        return baseQuery(arg, api, extraOptions)
      }
    }
    return defaultBQ(arg, api, extraOptions)
  }

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
  'actionConfig',
  'actions',
  'activity',
  'addonList',
  'addonSettings',
  'addonSettingsList',
  'addonSettingsOverrides',
  'addonSettingsSchema',
  'anatomyPresets',
  'attribute',
  'branch',
  'bundleList',
  'config',
  'connections',
  'customRoots',
  'dependencyPackage',
  'detail',
  'entities',
  'entitiesVersions',
  'entity',
  'entityActivities',
  'entityList',
  'entityListItem',
  'entityListAttribute',
  'entityListFolder',
  'feedback',
  'folder',
  'hierarchy',
  'inbox',
  'info',
  'installerList',
  'kanban',
  'kanBanTask',
  'login',
  'marketAddon',
  'overviewTask',
  'product',
  'progress',
  'project',
  'projectAddons',
  'projects',
  'review',
  'secrets',
  'service',
  'session',
  'settingsAddons',
  'shared',
  'siteRoots',
  'siteSettings',
  'siteSettingsSchema',
  'tag',
  'task',
  'team',
  'user',
  'userPool',
  'version',
  'view',
  'viewer',
  'watchers',
  'workfile',
  'link',
  'guest',
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

export const client = new GraphQLClient(`${window.location.origin}/graphql`)

const baseGraphqlQuery = graphqlRequestBaseQuery({
  prepareHeaders: prepareHeaders,
  url: '/graphql',
  // @ts-ignore
  client: client,
})

// check for 401 and redirect to login
const baseQuery = fetchBaseQuery({ baseUrl: '/', prepareHeaders: prepareHeaders })

const polymorphBaseQuery = combineBaseQueries(baseQuery, {
  baseQuery: baseGraphqlQuery,
  predicate: (args: any) => !!args.document && !!args.variables,
})

// @ts-ignore
const baseQueryWithRedirect: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const url = window.location.pathname
  const shouldRedirectToLogin = () => {
    if (!url.includes('connect') && !url.startsWith('/login')) {
      console.error('Unauthorized: 401 error')
      window.location.href = '/login'
    }
  }

  try {
    const result = await polymorphBaseQuery(args, api, extraOptions)

    // @ts-ignore
    if (result?.error?.status === 401) {
      shouldRedirectToLogin()
    }

    return result
  } catch (error: any) {
    if (error?.response && error.response?.status === 401) {
      shouldRedirectToLogin()
    } else {
      console.error(error)
    }
    throw error
  } finally {
  }
}

// Define the REST API and Graphql API
export const api = createApi({
  reducerPath: 'restApi',
  baseQuery: baseQueryWithRedirect,
  endpoints: () => ({}),
  tagTypes,
})
