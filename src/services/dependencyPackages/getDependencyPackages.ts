import { desktopApi } from '@shared/api'

const enhancedApi = desktopApi.enhanceEndpoints({
  endpoints: {
    listDependencyPackages: {
      providesTags: ['dependencyPackage'],
    },
  },
})
export const { useListDependencyPackagesQuery } = enhancedApi

export default enhancedApi
