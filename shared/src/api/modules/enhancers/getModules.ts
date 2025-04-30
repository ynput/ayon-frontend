import { enhancedApi } from '../modules'

export const getModulesApi = enhancedApi.enhanceEndpoints({
  endpoints: {
    listFrontendModules: {},
  },
})

export const { useListFrontendModulesQuery } = getModulesApi
