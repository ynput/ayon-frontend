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
    getEnumOptions: build.query<EnumItem[], { enumName: string; params?: EnumResolverParams }>({
      query: ({ enumName, params }) => ({
        url: `/api/enum/${enumName}`,
        params: buildParams(params),
      }),
      providesTags: (_result, _error, { enumName }) => [{ type: 'enum', id: enumName }],
    }),
  }),
  overrideExisting: false,
})

export const { useListEnumsQuery, useGetEnumOptionsQuery } = enumsQueries
