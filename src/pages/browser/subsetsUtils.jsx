import { useRef, useMemo, useState } from 'react'
import { LinkButton } from '@ynput/ayon-react-components'
import { Menu } from 'primereact/menu'

const VersionList = (row, onSelectVersion) => {
  const menu = useRef(null)
  const [currentVersion, setCurrentVersion] = useState(null)

  const versions = useMemo(() => {
    if (!row.versionList) return []
    return row.versionList.map((version) => {
      if (version.id === row.versionId) setCurrentVersion(version.name)
      return {
        id: version.id,
        label: version.name,
        command: () => onSelectVersion(row.id, version.id),
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row.versionList, row.versionId, row.id, menu])

  return (
    <>
      <Menu model={versions} popup ref={menu} />
      <LinkButton label={currentVersion} onClick={(e) => menu.current.toggle(e)} />
    </>
  )
}

const SUBSET_QUERY = `
query Subsets($projectName: String!, $folders: [String!]!, $versionOverrides: [String!]!) {
    project(name: $projectName){
        subsets(folderIds: $folders){
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
      folder: subset.folder.name,
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

export { VersionList, SUBSET_QUERY, parseSubsetData }
