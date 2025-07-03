import api from './getDependencyPackages'

const updateDependencyPackagesApi = api.enhanceEndpoints({
  endpoints: {
    createDependencyPackage: {
      invalidatesTags: ['dependencyPackage'],
    },
    deleteDependencyPackage: {
      invalidatesTags: ['dependencyPackage'],
    },
  },
})

import queryUpload from '@queries/queryUpload'
const updateDependencyPackagesApiInjected = updateDependencyPackagesApi.injectEndpoints({
  endpoints: (build) => ({
    uploadDependencyPackages: build.mutation({
      queryFn: (arg, api) => queryUpload(arg, api, { endpoint: '/api/desktop/dependencyPackages' }),
    }),
  }), // endpoints
  overrideExisting: true,
})

export const {
  useCreateDependencyPackageMutation,
  useUploadDependencyPackagesMutation,
  useDeleteDependencyPackageMutation,
} = updateDependencyPackagesApiInjected
export { updateDependencyPackagesApiInjected as dependencyPackagesQueries }
