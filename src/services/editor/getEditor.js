import { ayonApi } from '../ayon'
import { buildQuery } from '/src/pages/editor/queries'

const transformEditorData = (project) => {
  const nodes = {}

  // Add folders
  for (const edge of project.folders.edges) {
    const node = edge.node
    nodes[node.id] = {
      data: {
        ...node,
        __parentId: node.parentId || 'root',
        __entityType: 'folder',
      },
      leaf: !(node.hasChildren || node.hasTasks),
    }
  }

  // Add tasks
  for (const edge of project.tasks.edges) {
    const node = edge.node
    nodes[node.id] = {
      data: {
        ...node,
        __parentId: node.folderId || 'root',
        __entityType: 'task',
      },
      leaf: true, // Tasks never have children
    }
  }

  return nodes
}

const getEditor = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getEditorRoot: build.query({
      query: ({ projectName }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: buildQuery(),
          variables: { projectName, parents: ['root'] },
        },
      }),
      transformResponse: (response) => transformEditorData(response.data?.project),
      providesTags: (res) => [
        'project',
        'folder',
        'subset',
        'task',
        ...Object.keys(res).map((id) => ({ type: 'branch', id })),
      ],
    }),
    getExpandedBranch: build.query({
      query: ({ projectName, parentId }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: buildQuery(),
          variables: { projectName, parents: parentId },
        },
      }),
      transformResponse: (response) => transformEditorData(response.data?.project),
      providesTags: (res, error, { parentId }) => [{ type: 'branch', id: parentId }],
      async onCacheEntryAdded({ projectName }, { cacheDataLoaded, getCacheEntry, dispatch }) {
        try {
          // wait for the initial query to resolve before proceeding
          await cacheDataLoaded

          // get new branches from query result
          const newBranches = getCacheEntry().data
          console.log('new branch loaded')

          if (newBranches) {
            console.log('patching in branches to root', newBranches)
            //   patch new branches into root cache
            dispatch(
              ayonApi.util.updateQueryData('getEditorRoot', { projectName }, (draft) => {
                Object.assign(draft, { ...draft, ...newBranches })
              }),
            )
          }
        } catch (error) {
          console.error(error)
        }
      },
    }),
  }),
})

export const { useGetEditorRootQuery, useGetExpandedBranchQuery } = getEditor
