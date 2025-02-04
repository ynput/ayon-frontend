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
  },
})

export const {
  useGetServerConfigQuery,
  useGetServerConfigOverridesQuery,
  useGetServerConfigSchemaQuery,
} = getConfigApi
