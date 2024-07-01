import api from '@api'
import queryUpload from './queryUpload'

const getDependencyPackages = api.rest.injectEndpoints({
  endpoints: (build) => ({
    getDependencyPackageList: build.query({
      query: () => ({
        url: `/api/desktop/dependencyPackages`,
      }),
      transformResponse: (res) => res.packages,
      providesTags: () => [{ type: 'dependencyPackageList' }],
    }),
    uploadDependencyPackages: build.mutation({
      queryFn: (arg, api) => queryUpload(arg, api, { endpoint: '/api/desktop/dependencyPackages' }),
    }),
  }), // endpoints
  overrideExisting: true,
})

export const { useGetDependencyPackageListQuery, useUploadDependencyPackagesMutation } =
  getDependencyPackages
