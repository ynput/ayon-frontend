import { ayonApi } from './ayon'
import queryUpload from './queryUpload'

const getDependencyPackages = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getDependencyPackageList: build.query({
      query: () => ({
        url: `/api/desktop/dependencyPackages`,
      }),
      transformResponse: (res) => res.packages,
      providesTags: () => [{ type: 'dependencyPackageList' }],
    }),
    uploadDependencyPackages: build.mutation({
      queryFn: (arg, api) =>
        queryUpload(arg, api, { endpoint: '/api/desktop/dependencyPackages' }),
    }),
  }), // endpoints
})

export const { useGetDependencyPackageListQuery, useUploadDependencyPackagesMutation } =
  getDependencyPackages
