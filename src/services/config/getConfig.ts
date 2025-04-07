import { api } from '@api/rest/config'

export const getConfigApi = api.enhanceEndpoints({
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
