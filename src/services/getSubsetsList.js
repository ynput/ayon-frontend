import { ayonApi } from './ayon'

const parseSubsetFps = (subset) => {
  const folderFps = subset.folder.attrib.fps || ''
  if (!subset) return folderFps
  if (!subset.latestVersion) return folderFps
  if (!subset.latestVersion.attrib) return folderFps
  return subset.latestVersion.attrib.fps || ''
}

const parseSubsetResolution = (subset) => {
  /* 
    Return the resolution of the latest version of the given subset, 
    or resolution of the folder if the version has no resolution 
    */
  const folderWidth = subset.folder.attrib.resolutionWidth || null
  const folderHeight = subset.folder.attrib.resolutionHeight || null
  const folderResolution = folderWidth && folderHeight ? `${folderWidth}x${folderHeight}` : ''

  if (!subset?.latestVersion?.attrib) return folderResolution

  const width = subset.latestVersion.attrib.resolutionWidth || null
  const height = subset.latestVersion.attrib.resolutionHeight || null
  const resolution = width && height ? `${width}x${height}` : ''
  return resolution || folderResolution
}

const parseSubsetFrames = (subset) => {
  const folderStart = subset.folder.attrib.frameStart || null
  const folderEnd = subset.folder.attrib.frameEnd || null
  const folderFrames = folderStart && folderEnd ? `${folderStart}-${folderEnd}` : ''

  if (!subset?.latestVersion?.attrib) return ''
  const frameStart = subset.latestVersion.attrib.frameStart || ''
  const frameEnd = subset.latestVersion.attrib.frameEnd || ''
  const frames = frameStart && frameEnd ? `${frameStart}-${frameEnd}` : ''
  return frames || folderFrames
}

const parseSubsetData = (data) => {
  let s = []
  for (let subsetEdge of data.project.subsets.edges) {
    let subset = subsetEdge.node

    let vers
    if (subset.versions.edges.length === 1) vers = subset.versions.edges[0].node
    else if (subset.latestVersion) vers = subset.latestVersion
    else vers = null
    let sub = {
      id: subset.id,
      name: subset.name,
      family: subset.family,
      status: subset.status,
      fps: parseSubsetFps(subset),
      resolution: parseSubsetResolution(subset),
      folder: subset.folder.label || subset.folder.name,
      folderId: subset.folder.id,
      author: vers ? vers.author : null,
      parents: subset.folder.parents,
      versionList: subset.versionList || [],
      version: vers ? vers.version : null,
      versionId: vers && vers.id ? vers.id : null,
      versionName: vers && vers.name ? vers.name : '',
      taskId: vers && vers.taskId ? vers.taskId : null,
      frames: parseSubsetFrames(subset),
      createdAt: vers ? vers.createdAt : subset.createdAt,
    }
    s.push(sub)
  }
  return s
}

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
