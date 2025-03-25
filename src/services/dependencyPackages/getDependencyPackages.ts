import { api } from '@api/rest/dependencyPackages'

const dependencyPackagesApi = api.enhanceEndpoints({
  endpoints: {
    listDependencyPackages: {
      providesTags: ['dependencyPackage'],
    },
  },
})
export const { useListDependencyPackagesQuery } = dependencyPackagesApi

export default dependencyPackagesApi
