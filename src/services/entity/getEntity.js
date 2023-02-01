import { ayonApi } from '../ayon'
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

const SUBSET_QUERY = `
query Subset($projectName: String!, $ids: [String!]!, $versionOverrides: [String!]!) {
    project(name: $projectName){
        subsets(ids: $ids){
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
                }
            }
        }
    }
}
`

const buildEventTileQuery = (type) => {
  return `
  query EventTile($projectName: String!, $id: String!) {
    project(name: $projectName) {
      ${type}(id: $id) {
        id
        name
        status
        updatedAt
      }
    }
  }
  `
}

const buildEntitiesQuery = (type, attribs) => {
  let f_attribs = attribs || ''
  if (!attribs) {
    for (const attrib of ayonClient.settings.attributes) {
      if (attrib.scope.includes(type)) f_attribs += `${attrib.name}\n`
    }
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
    case 'subset':
      QUERY = SUBSET_QUERY
      break
    default:
      break
  }

  if (!QUERY) return null

  return QUERY.replace('#ATTRS#', f_attribs)
}

const getEntity = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getEntitiesDetails: build.query({
      query: ({
        projectName,
        ids,
        type,
        versionOverrides = ['00000000000000000000000000000000'],
        attribs,
      }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: buildEntitiesQuery(type, attribs),
          variables: { projectName, ids, versionOverrides },
        },
      }),
      transformResponse: (response, meta, { type }) => response.data.project[type + 's'].edges,
      transformErrorResponse: (error) => error.data?.detail || `Error ${error.status}`,
      providesTags: (result, error, { type }) =>
        result ? [...result.map(({ node }) => ({ type: type, id: node.id }))] : [type],
    }),
    getEventTile: build.query({
      query: ({ projectName, id, type }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: buildEventTileQuery(type),
          variables: { projectName, id },
        },
      }),
      transformResponse: (response, meta, { type }) => response.data.project[type],
    }),
  }),
})

export const { useGetEntitiesDetailsQuery, useGetEventTileQuery } = getEntity
