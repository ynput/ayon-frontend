import { api } from '../modules'

export const getModulesApi = api.enhanceEndpoints({
  endpoints: {
    listFrontendModules: {},
  },
})

export const { useListFrontendModulesQuery } = getModulesApi
