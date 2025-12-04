import getConfigApi from './getConfig'

const updateConfigApi = getConfigApi.enhanceEndpoints({
  endpoints: {
    setServerConfig: {
      invalidatesTags: ['config'],
    },
  },
})

export const { useSetServerConfigMutation } = updateConfigApi
export { updateConfigApi as configurationQueries }
