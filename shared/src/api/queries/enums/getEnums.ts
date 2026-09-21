import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { enumsApi } from '@shared/api/generated'
import type { EnumItem } from '@shared/api/generated'

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
    }),
  }),
  overrideExisting: false,
})

export const enumOptionsQueries = enumsQueries

export const { useListEnumsQuery, useGetEnumOptionsQuery, useLazyGetEnumOptionsQuery } =
  enumsQueries
