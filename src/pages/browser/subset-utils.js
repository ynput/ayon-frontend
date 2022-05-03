import { DateTime } from 'luxon'

const DEFAULT_COLUMNS = [
  {
    field: 'name',
    header: 'Subset',
    width: 200,
  },
  {
    field: 'folder',
    header: 'Folder',
    width: 200,
  },
  {
    field: 'family',
    header: 'Family',
    width: 120,
  },
  {
    field: 'versionName',
    header: 'Version',
    width: 70,
  },
  {
    field: 'time',
    header: 'Time',
    width: 150,
    body: (row) => DateTime.fromSeconds(row.createdAt).toRelative(),
  },
  {
    field: 'author',
    header: 'Author',
    width: 120,
  },
  {
    field: 'frames',
    header: 'Frames',
    width: 120,
  },
]

const SUBSET_QUERY = `
query Subsets($projectName: String!, $folders: [String!]!){
    project(name: $projectName){
        subsets(folderIds: $folders){
            edges {
                node {
                    id
                    name
                    family
                    createdAt
                    versionList{
                      id
                      version
                    }
                    latestVersion{
                        id
                        version
                        name
                        author
                        createdAt
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
  const folderResolution =
    folderWidth && folderHeight ? `${folderWidth}x${folderHeight}` : ''

  if (!subset) return folderResolution
  if (!subset.latestVersion) return folderResolution
  if (!subset.latestVersion.attrib) return folderResolution

  const width = subset.latestVersion.attrib.resolutionWidth || null
  const height = subset.latestVersion.attrib.resolutionHeight || null
  const resolution = width && height ? `${width}x${height}` : ''
  return resolution || folderResolution
}

const parseSubsetFrames = (subset) => {
  const folderStart = subset.folder.attrib.frameStart || null
  const folderEnd = subset.folder.attrib.frameEnd || null
  const folderFrames =
    folderStart && folderEnd ? `${folderStart}-${folderEnd}` : ''

  if (!subset) return ''
  if (!subset.latestVersion) return ''
  if (!subset.latestVersion.attrib) return ''
  const frameStart = subset.latestVersion.attrib.frameStart || ''
  const frameEnd = subset.latestVersion.attrib.frameEnd || ''
  const frames = frameStart && frameEnd ? `${frameStart}-${frameEnd}` : ''
  return frames || folderFrames
}

const parseSubsetData = (data) => {
  let s = []
  for (let subsetEdge of data.project.subsets.edges) {
    let subset = subsetEdge.node
    let vers = subset.latestVersion || null
    let sub = {
      id: subset.id,
      name: subset.name,
      family: subset.family,
      fps: parseSubsetFps(subset),
      resolution: parseSubsetResolution(subset),
      folder: subset.folder.name,
      author: vers ? vers.author : null,
      parents: subset.folder.parents,
      version: vers ? vers.version : null,
      versionId: vers && vers.id ? vers.id : null,
      versionName: vers && vers.name ? vers.name : '',
      frames: parseSubsetFrames(subset),
      createdAt: vers ? vers.createdAt : subset.createdAt,
    }
    s.push(sub)
  }
  return s
}

export { DEFAULT_COLUMNS, SUBSET_QUERY, parseSubsetData }
