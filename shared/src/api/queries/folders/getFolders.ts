import { foldersApi } from '@shared/api/generated'

const enhancedApi = foldersApi.enhanceEndpoints({
  endpoints: {
    getFolderHierarchy: {
      providesTags: ['hierarchy'],
    },
    getFolderList: {
      providesTags: (result, _e, { projectName }) => [
        'hierarchy',
        { type: 'folder', id: 'LIST' },
        ...(result?.folders.map(({ id }) => ({ type: 'folder', id })) || []),
        { type: 'folder', id: projectName },
      ],
    },
  },
})

export const { useGetFolderHierarchyQuery, useGetFolderListQuery } = enhancedApi
export { enhancedApi as foldersQueries }
