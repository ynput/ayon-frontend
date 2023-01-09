// Need to use the React-specific entry point to allow generating React hooks
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import short from 'short-uuid'
import { parseSubsetData } from '../pages/browser/subsetsUtils'
import ayonClient from '/src/ayon'

const TASK_QUERY = `
  query Tasks($projectName: String!, $ids: [String!]!) {
      project(name: $projectName) {
          tasks(ids: $ids) {
              edges {
                  node {
                      id
                      name
                      label
                      status
                      tags
                      taskType
                      assignees
                      attrib {
                        #ATTRS#
                      }
                  }
              }
          }
      }
  }
`

const FOLDER_QUERY = `
    query Folders($projectName: String!, $ids: [String!]!) {
        project(name: $projectName) {
            folders(ids: $ids) {
                edges {
                    node {
                        id
                        name
                        label
                        folderType
                        path
                        status
                        tags
                        attrib {
                          #ATTRS#
                        }
                    }
                }
            }
        }
    }

`

const VERSION_QUERY = `
    query Versions($projectName: String!, $ids: [String!]!) {
        project(name: $projectName) {
            versions(ids: $ids) {
                edges {
                    node {
                        id
                        version
                        name
                        author
                        status
                        tags
                        attrib {
                          #ATTRS#
                        }
                        subset {
                            name
                            family
                            folder {
                                name
                                parents
                            }
                        }
                        representations{
                            edges {
                                node {
                                    id
                                    name
                                    fileCount
                                }
                            }
                        }
                    }
                }
            }
        }
    }
`

const SUBSETS_LIST_QUERY = `
query Subsets($projectName: String!, $ids: [String!]!, $versionOverrides: [String!]!) {
    project(name: $projectName){
        subsets(folderIds: $ids){
            edges {
                node {
                    id
                    name
                    family
                    status
                    createdAt
                    versionList{
                      id
                      version
                      name
                    }
                    
                    versions(ids: $versionOverrides){
                      edges{
                        node{
                          id
                          version
                          name
                          author
                          createdAt
                          taskId
                          attrib {
                              fps
                              resolutionWidth
                              resolutionHeight
                              frameStart
                              frameEnd
                          }
                        }
                      }
                    }

                    latestVersion{
                        id
                        version
                        name
                        author
                        createdAt
                        taskId
                        attrib {
                            fps
                            resolutionWidth
                            resolutionHeight
                            frameStart
                            frameEnd
                        }
                    }
                    folder {
                        id
                        name
                        parents
                        attrib {
                            fps
                            resolutionWidth
                            resolutionHeight
                            frameStart
                            frameEnd
                        }
                    }
                }
            }
        }
    }
}
`

const buildEntitiesDetailsQuery = (type) => {
  let f_attribs = ''
  for (const attrib of ayonClient.settings.attributes) {
    if (attrib.scope.includes(type)) f_attribs += `${attrib.name}\n`
  }

  let QUERY
  switch (type) {
    case 'task':
      QUERY = TASK_QUERY
      break
    case 'folder':
      QUERY = FOLDER_QUERY
      break
    case 'version':
      QUERY = VERSION_QUERY
      break
    default:
      break
  }

  if (!QUERY) return null

  return QUERY.replace('#ATTRS#', f_attribs)
}

const buildOperations = (ids, type, data) =>
  ids.map((id) => ({
    type: 'update',
    entityType: type,
    entityId: id,
    data,
  }))

// Define a service using a base URL and expected endpoints
export const ayonApi = createApi({
  reducerPath: 'ayonApi',
  baseQuery: fetchBaseQuery({
    prepareHeaders: (headers) => {
      const storedAccessToken = localStorage.getItem('accessToken')
      if (storedAccessToken) {
        // headers.common['Authorization'] = `Bearer ${storedAccessToken}`
        headers.set('Authorization', `Bearer ${storedAccessToken}`)
      }
      //   headers.common['X-Sender'] = short.generate()
      headers.set('X-Sender', short.generate())

      return headers
    },
  }),
  tagTypes: ['folder', 'task', 'version', 'subset', 'tag', 'project'],
  endpoints: (builder) => ({
    updateEntitiesDetails: builder.mutation({
      query: ({ projectName, type, patches, data, ids }) => ({
        url: `/api/projects/${projectName}/operations`,
        method: 'POST',
        body: {
          operations: buildOperations(ids || patches.map((p) => p.id), type, data),
        },
      }),
      async onQueryStarted({ projectName, type, patches }, { dispatch, queryFulfilled }) {
        if (!patches) return

        const patchResult = dispatch(
          ayonApi.util.updateQueryData(
            'getEntitiesDetails',
            { projectName, ids: patches.map((p) => p.id), type },
            (draft) => {
              Object.assign(
                draft,
                patches.map((p) => ({ node: p })),
              )
            },
          ),
        )
        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },
      invalidatesTags: (result, error, { type, ids, patches }) =>
        ids ? ids.flatMap((id) => [{ type, id }]) : patches.flatMap(({ id }) => [{ type, id }]),
    }),
    getEntitiesDetails: builder.query({
      query: ({ projectName, ids, type }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: buildEntitiesDetailsQuery(type),
          variables: { projectName, ids },
        },
      }),
      transformResponse: (response, meta, { type }) => response.data.project[type + 's'].edges,
      providesTags: (result, error, { type }) =>
        result ? [...result.map(({ node }) => ({ type: type, id: node.id }))] : [type],
    }),
    getSubsetsList: builder.query({
      query: ({ projectName, ids, versionOverrides }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: SUBSETS_LIST_QUERY,
          variables: { projectName, ids, versionOverrides },
        },
      }),
      transformResponse: (response) => parseSubsetData(response.data),
      providesTags: (result) =>
        result ? [...result.map(({ id }) => ({ type: 'subset', id }))] : ['subset'],
    }),
    updateSubsets: builder.mutation({
      query: ({ projectName, data, ids }) => ({
        url: `/api/projects/${projectName}/operations`,
        method: 'POST',
        body: {
          operations: buildOperations(ids, 'subset', data),
        },
      }),
      async onQueryStarted(
        { projectName, patches, versionOverrides, focusedFolders },
        { dispatch, queryFulfilled },
      ) {
        if (!patches) return

        const patchResult = dispatch(
          ayonApi.util.updateQueryData(
            'getSubsetsList',
            { projectName, ids: focusedFolders, versionOverrides },
            (draft) => {
              Object.assign(draft, patches)
            },
          ),
        )
        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },
      invalidatesTags: (result, error, { patches }) => [
        ...patches.map(({ id }) => ({ type: 'subset', id })),
      ],
    }),
    getHierarchy: builder.query({
      query: ({ projectName }) => ({
        url: `/api/projects/${projectName}/hierarchy`,
      }),
      transformResponse: (response) => response.hierarchy,
      transformErrorResponse: (error) => error.data.detail || `Error ${error.status}`,
      providesTags: ['project'],
    }),
  }),
})

// Export hooks for usage in function components, which are
// auto-generated based on the defined endpoints
export const {
  useUpdateEntitiesDetailsMutation,
  useGetEntitiesDetailsQuery,
  useGetSubsetsListQuery,
  useUpdateSubsetsMutation,
  useGetHierarchyQuery,
} = ayonApi
