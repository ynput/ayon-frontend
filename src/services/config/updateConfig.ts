import { getConfigApi } from './getConfig'

export const updateConfigApi = getConfigApi.enhanceEndpoints({
  endpoints: {
    setServerConfig: {
      invalidatesTags: ['config'],
    },
  },
})

export const { useSetServerConfigMutation } = updateConfigApi
