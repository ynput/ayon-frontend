import { configApi } from '@shared/api'

export const getConfigApi = configApi.enhanceEndpoints({
  endpoints: {
    getServerConfig: {
      providesTags: ['config'],
    },
    getServerConfigOverrides: {
      providesTags: ['config'],
    },
    getServerConfigSchema: {},
    getConfigValue: {
      providesTags: ['config'],
    },
  },
})

export const {
  useGetServerConfigQuery,
  useGetServerConfigOverridesQuery,
  useGetServerConfigSchemaQuery,
  useGetConfigValueQuery,
} = getConfigApi
