import { api } from '../folders'

const hierarchyApi = api.enhanceEndpoints({
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

export const { useGetFolderHierarchyQuery, useGetFolderListQuery } = hierarchyApi
export { hierarchyApi }
