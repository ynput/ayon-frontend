import { bundlesApi, projectsApi } from '@shared/api'

const getBundles = bundlesApi.enhanceEndpoints({
  endpoints: {
    listBundles: {
      providesTags: () => [{ type: 'bundleList' }],
    },
    checkBundleCompatibility: {},
  },
})

const enhancedProjectsApi = projectsApi.enhanceEndpoints({
  endpoints: {
    getProjectBundleInfo: {
      providesTags: (_result, _error, { projectName }) => [
        { type: 'bundle', id: projectName },
        { type: 'bundleList' },
      ],
    },
  },
})

export const { useListBundlesQuery, useLazyListBundlesQuery, useCheckBundleCompatibilityQuery } =
  getBundles

export const { useGetProjectBundleInfoQuery } = enhancedProjectsApi

export default getBundles
