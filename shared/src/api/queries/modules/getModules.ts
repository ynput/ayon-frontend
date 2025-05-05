import { modulesApi } from '@shared/api/generated'

export const getModulesApi = modulesApi.enhanceEndpoints({
  endpoints: {
    listFrontendModules: {},
  },
})

export const { useListFrontendModulesQuery } = getModulesApi
export { getModulesApi as modulesQueries }
