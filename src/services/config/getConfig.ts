import { configurationApi } from '@shared/api'

const getConfigApi = configurationApi.enhanceEndpoints({
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

export default getConfigApi
