import { api } from '@api/rest/folders'

const hierarchyApi = api.enhanceEndpoints({
  endpoints: {
    getFolderHierarchy: {
      providesTags: ['hierarchy'],
    },
    getFolderList: {
      providesTags: ['hierarchy'],
    },
  },
})

export const { useGetFolderHierarchyQuery, useGetFolderListQuery } = hierarchyApi

export default hierarchyApi
