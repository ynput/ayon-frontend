import { api } from '@api/rest/folders'
import { FolderListModel } from '@api/rest/folders'

const enhancedApi = api.enhanceEndpoints({
  endpoints: {
    getFolderHierarchy: {
      providesTags: ['hierarchy'],
    },
    getFolderList: {
      providesTags: ['hierarchy'],
      // sort folders by parents.length with the least first
      transformResponse: (response: FolderListModel) => {
        const folders = response.folders
        folders.sort((a, b) => a.parents.length - b.parents.length)
        return {
          ...response,
          folders,
        }
      },
    },
  },
})

export const { useGetFolderHierarchyQuery, useGetFolderListQuery } = enhancedApi
