import api from '@api'

const enhancedApi = api.enhanceEndpoints({
  endpoints: {
    getFolderHierarchy: {
      providesTags: ['hierarchy'],
    },
  },
})

export const { useGetFolderHierarchyQuery } = enhancedApi
