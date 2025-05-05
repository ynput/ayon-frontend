import { dependencyPackagesApi } from '@shared/api'

const enhancedApi = dependencyPackagesApi.enhanceEndpoints({
  endpoints: {
    listDependencyPackages: {
      providesTags: ['dependencyPackage'],
    },
  },
})
export const { useListDependencyPackagesQuery } = enhancedApi

export default enhancedApi
