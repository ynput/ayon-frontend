import { api } from '@api/rest/folders'

const enhancedApi = api.enhanceEndpoints({
  endpoints: {
    getFolderHierarchy: {
      providesTags: ['hierarchy'],
    },
    getFolderList: {
      providesTags: ['hierarchy'],
    },
  },
})

export const { useGetFolderHierarchyQuery, useGetFolderListQuery } = enhancedApi
