import { enumsApi } from '@shared/api/generated'
import type { EnumItem } from '@shared/api/generated'

export type EnumResolverParams = Record<string, string | number | boolean | undefined | null>

export const ENUM_RESOLVERS_TAG = { type: 'enum' as const, id: 'RESOLVERS' }

// Enums fed by the user/team tables, so their mutations invalidate only these
export const USER_ENUM_TAGS = [
  { type: 'enum' as const, id: 'users' },
  { type: 'enum' as const, id: 'usersAndTeams' },
]

export const TEAM_ENUM_TAGS = [
  { type: 'enum' as const, id: 'teams' },
  { type: 'enum' as const, id: 'usersAndTeams' },
]

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
