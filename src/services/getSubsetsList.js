import { parseSubsetData } from '../pages/browser/subsetsUtils'
import { ayonApi } from './ayon'

const SUBSETS_LIST_QUERY = `
query SubsetsList($projectName: String!, $ids: [String!]!, $versionOverrides: [String!]!) {
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

const getSubsetsList = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getSubsetsList: build.query({
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
  }),
})

export const { useGetSubsetsListQuery } = getSubsetsList
