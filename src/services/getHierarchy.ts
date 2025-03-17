import { api } from '@api/rest/folders'

const hierarchyApi = api.enhanceEndpoints({
  endpoints: {
    getFolderHierarchy: {
      providesTags: ['hierarchy'],
    },
    getFolderList: {
      providesTags: (result) => [
        'hierarchy',
        { type: 'folder', id: 'LIST' },
        ...(result?.folders.map(({ id }) => ({ type: 'folder', id })) || []),
      ],
    },
  },
})

export const { useGetFolderHierarchyQuery, useGetFolderListQuery } = hierarchyApi

export default hierarchyApi
