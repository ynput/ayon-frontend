import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { enumsApi } from '@shared/api/generated'
import type { AttributeData, EnumItem } from '@shared/api/generated'
import { getAttributeEnumKey } from '@shared/util/attributeEnum'

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

export type EnumResolverSource = Pick<AttributeData, 'enumResolver' | 'enumResolverSettings'>

export type EnumContext = {
  projectName?: string
  userName?: string
}

// Context params go in last: they are the live page scope and must win over saved settings
export const getEnumOptionsArgs = (
  data: EnumResolverSource | undefined,
  { projectName, userName }: EnumContext = {},
  acceptedParams?: Record<string, unknown>,
) => {
  const params: EnumResolverParams = {
    ...((data?.enumResolverSettings as Record<string, any>) || {}),
  }
  // a resolver that ignores a context param must not get a cache entry per project or per user
  const accepts = (name: string) => !acceptedParams || name in acceptedParams
  if (projectName && accepts('project_name')) params.project_name = projectName
  if (userName && accepts('user')) params.user = userName

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
      // the batch reads it without subscribing, so nothing else keeps the registry around
      keepUnusedDataFor: 600,
    },
  },
})

// Re-declared because the generated getEnum cannot pass resolver query params
const enumsQueries = enhancedApi.injectEndpoints({
  endpoints: (build) => ({
    getEnumOptions: build.query<
      EnumOptionsResult,
      { enumName: string; params?: EnumResolverParams }
    >({
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
      // the batch query subscribes to nothing, so this is the only thing keeping entries around
      keepUnusedDataFor: 600,
    }),
  }),
  overrideExisting: false,
})

// enumResolver is required here: the caller filters non-resolver attributes out first
export type EnumOptionsBatchRequest = EnumResolverSource & { key: string; enumResolver: string }

export type EnumOptionsBatchArgs = EnumContext & {
  requests: EnumOptionsBatchRequest[]
}

export type EnumOptionsBatchResult = Record<string, EnumOptionsResult>

// Context is deliberately out of the key: it only decides which params a resolver is sent
export const buildEnumOptionsRequest = (data: EnumResolverSource): EnumOptionsBatchRequest => ({
  key: getAttributeEnumKey(data),
  enumResolver: data.enumResolver as string,
  enumResolverSettings: data.enumResolverSettings,
})

// Resolves many attributes at once by composing the single-resolver cache, it never fetches itself
const enumOptionsBatchQueries = enumsQueries.injectEndpoints({
  endpoints: (build) => ({
    getEnumOptionsBatch: build.query<EnumOptionsBatchResult, EnumOptionsBatchArgs>({
      async queryFn({ requests, projectName, userName }, api) {
        // without the registry every param is sent, which is what the app did before
        const acceptedParams = new Map<string, Record<string, unknown>>()
        try {
          const resolvers = await api
            .dispatch(enumsQueries.endpoints.listEnums.initiate(undefined, { subscribe: false }))
            .unwrap()
          resolvers.forEach((resolver) => acceptedParams.set(resolver.name, resolver.acceptedParams))
        } catch {
          // keep resolving: a missing registry only costs a wider cache key
        }

        const unique = new Map(requests.map((request) => [request.key, request]))

        const entries = await Promise.all(
          [...unique.values()].map(async (request) => {
            const args = getEnumOptionsArgs(
              request,
              { projectName, userName },
              acceptedParams.size ? acceptedParams.get(request.enumResolver) : undefined,
            )
            // an already cached resolver resolves without a request
            const result = await api
              .dispatch(
                enumsQueries.endpoints.getEnumOptions.initiate(args, {
                  subscribe: false,
                  // a forced batch refetch must reach the single-resolver entries too
                  forceRefetch: api.forced,
                }),
              )
              .unwrap()
            return [request.key, result] as const
          }),
        )
        return { data: Object.fromEntries(entries) }
      },
      providesTags: (_result, _error, { requests }) => [
        ENUM_RESOLVERS_TAG,
        ...requests.map(({ enumResolver }) => ({ type: 'enum' as const, id: enumResolver })),
      ],
    }),
  }),
  overrideExisting: false,
})

export const enumOptionsQueries = enumOptionsBatchQueries

export const {
  useListEnumsQuery,
  useGetEnumOptionsQuery,
  useLazyGetEnumOptionsQuery,
  useGetEnumOptionsBatchQuery,
} = enumOptionsBatchQueries
