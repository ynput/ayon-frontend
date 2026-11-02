import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { enumsApi } from '@shared/api/generated'
import type { AttributeData, EnumItem } from '@shared/api/generated'
import { sortKeysDeep } from '@shared/util/attributeEnum'

export type EnumResolverParams = Record<string, string | number | boolean | undefined | null>

export const ENUM_RESOLVERS_TAG = { type: 'enum' as const, id: 'RESOLVERS' }

// The users resolver also serves teams (mode=teams|both), so both tables feed it
export const USERS_ENUM_TAGS = [{ type: 'enum' as const, id: 'users' }]

const buildParams = (params?: EnumResolverParams) => {
  const entries = Object.entries(params || {}).filter(
    ([, value]) => value !== undefined && value !== null && value !== '',
  )
  return entries.length ? Object.fromEntries(entries) : undefined
}

export type EnumOptionsResult = {
  items: EnumItem[]
  error?: string
}

export type EnumOptionsArgs = { enumName: string; params?: EnumResolverParams }

// Same resolver and params (in any order) share one cache entry and one request
export const getEnumOptionsKey = ({ enumName, params }: EnumOptionsArgs): string =>
  JSON.stringify({ enumName, params: sortKeysDeep(buildParams(params) ?? {}) })

export type EnumResolverSource = Pick<AttributeData, 'enumResolver' | 'enumResolverSettings'>

// The `user` context param is never sent: the backend resolves it from the session,
// and only admins may pass another user (see EnumDebugDialog)
export type EnumContext = {
  projectName?: string
}

// Context params go in last: they are the live page scope and must win over saved settings
export const getEnumOptionsArgs = (
  data: EnumResolverSource | undefined,
  { projectName }: EnumContext = {},
  acceptedParams?: Record<string, unknown>,
): EnumOptionsArgs => {
  const params: EnumResolverParams = {
    ...((data?.enumResolverSettings as Record<string, any>) || {}),
  }
  // a resolver that ignores project_name must not get a cache entry per project
  const accepts = (name: string) => !acceptedParams || name in acceptedParams
  if (projectName && accepts('project_name')) params.project_name = projectName

  return { enumName: data?.enumResolver as string, params }
}

const getErrorDetail = (error: FetchBaseQueryError): string => {
  const detail = (error.data as { detail?: unknown } | undefined)?.detail
  if (typeof detail === 'string') return detail
  return `Request failed (${error.status})`
}

const enhancedApi = enumsApi.enhanceEndpoints({
  endpoints: {
    listEnums: {
      providesTags: [ENUM_RESOLVERS_TAG],
    },
  },
})

// Re-declared because the generated getEnum cannot pass resolver query params
const enumsQueries = enhancedApi.injectEndpoints({
  endpoints: (build) => ({
    getEnumOptions: build.query<EnumOptionsResult, EnumOptionsArgs>({
      // Failures are cached as data: RTK refetches a rejected query for every new subscriber
      async queryFn({ enumName, params }, _api, _extraOptions, baseQuery) {
        const result = await baseQuery({
          url: `/api/enum/${enumName}`,
          params: buildParams(params),
        })
        if (result.error) {
          return {
            data: { items: [], error: getErrorDetail(result.error as FetchBaseQueryError) },
          }
        }
        return { data: { items: result.data as EnumItem[] } }
      },
      providesTags: (_result, _error, { enumName }) => [{ type: 'enum', id: enumName }],
      keepUnusedDataFor: 600,
    }),
  }),
  overrideExisting: false,
})

export type EnumOptionsBatchArgs = { requests: EnumOptionsArgs[] }

export type EnumOptionsBatchResult = Record<string, EnumOptionsResult>

// Many getEnumOptions in one query: composes the single-resolver cache, never fetches itself
const enumOptionsBatchQueries = enumsQueries.injectEndpoints({
  endpoints: (build) => ({
    getEnumOptionsBatch: build.query<EnumOptionsBatchResult, EnumOptionsBatchArgs>({
      async queryFn({ requests }, api) {
        const unique = new Map(requests.map((request) => [getEnumOptionsKey(request), request]))

        const entries = await Promise.all(
          [...unique].map(async ([key, request]) => {
            const result = await api
              .dispatch(
                enumsQueries.endpoints.getEnumOptions.initiate(request, {
                  subscribe: false,
                  // a forced batch refetch must reach the single-resolver entries too
                  forceRefetch: api.forced,
                }),
              )
              .unwrap()
            return [key, result] as const
          }),
        )
        return { data: Object.fromEntries(entries) }
      },
      providesTags: (_result, _error, { requests }) =>
        requests.map(({ enumName }) => ({ type: 'enum' as const, id: enumName })),
    }),
  }),
  overrideExisting: false,
})

export const enumOptionsQueries = enumOptionsBatchQueries

export const {
  useListEnumsQuery,
  useLazyListEnumsQuery,
  useGetEnumOptionsQuery,
  useLazyGetEnumOptionsQuery,
  useGetEnumOptionsBatchQuery,
} = enumOptionsBatchQueries
