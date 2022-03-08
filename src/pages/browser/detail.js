import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useFetch } from 'use-http'

import { Button, Spacer } from '../../components'

import Representations from './representations'

const FOLDER_QUERY = `
    query Folders($projectName: String!, $folders: [String!]!) {
        project(name: $projectName) {
            folders(ids: $folders) {
                edges {
                    node {
                        name
                        folderType
                        attrib {
                            fps
                            resolutionWidth
                            resolutionHeight
                        }
                        tasks {
                            edges {
                              node {
                                name
                                taskType
                                assignees
                              }
                            }
                        }
                    }
                }
            }
        }
    }

`

const VERSION_QUERY = `
    query Versions($projectName: String!, $versions: [String!]!) {
        project(name: $projectName) {
            versions(ids: $versions) {
                edges {
                    node {
                        version
                        author
                        subset {
                            name
                            family
                            folder {
                                name
                            }
                        }
                        representations(localSite:"local", remoteSite:"remote"){
                            edges {
                                node {
                                    id
                                    name
                                    fileCount
                                    localStatus{
                                        status
                                        size
                                        totalSize
                                    }
                                    remoteStatus{
                                        status
                                        size
                                        totalSize
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
`

const FolderDetail = () => {
  const context = useSelector((state) => ({ ...state.contextReducer }))
  const projectName = context.projectName
  const folders = context.focusedFolders
  const [detailData, setDetailData] = useState(null)
  const request = useFetch('/graphql')

  const folderId = folders.length > 0 ? folders[folders.length - 1] : null

  useEffect(() => {
    async function fetchData() {
      const data = await request.query(FOLDER_QUERY, {
        projectName,
        folders: [folderId],
      })
      if (!(data.data && data.data.project)) {
        console.log('ERROR', data.errors[0].message)
        return
      }
      const projectData = data.data.project

      setDetailData(projectData.folders.edges[0].node)
    }

    fetchData()
    //eslint-disable-next-line
  }, [projectName, folderId])

  return (
    <section style={{ flexGrow: 1 }}>
      <pre
        style={{
          overflow: 'auto',
          flex: '1 1 1px',
          width: '100%',
        }}
      >
        {JSON.stringify(detailData, null, 2)}
      </pre>
    </section>
  )
}

const VersionDetail = () => {
  const context = useSelector((state) => ({ ...state.contextReducer }))
  const projectName = context.projectName
  const request = useFetch('/graphql')

  const [versions, setVersions] = useState([])
  const [representations, setRepresentations] = useState([])

  useEffect(() => {
    async function fetchData() {
      const data = await request.query(VERSION_QUERY, {
        projectName: projectName,
        versions: context.focusedVersions,
      })

      if (!(data.data && data.data.project)) {
        console.log('ERROR', data.errors[0].message)
        return
      }

      const projectData = data.data.project
      let vArr = []
      let rArr = []

      for (const versionEdge of projectData.versions.edges) {
        const version = versionEdge.node
        const subset = version.subset
        const folder = subset.folder
        vArr.push({
          id: version.id,
          version: version.version,
          author: version.author,
          attrib: version.attrib,
          family: subset.family,
          subsetName: subset.name,
          folderName: folder.name,
        })
        for (const representationEdge of version.representations.edges) {
          const representation = representationEdge.node
          rArr.push({
            id: representation.id,
            name: representation.name,
            folderName: folder.name,
            subsetName: subset.name,
            family: subset.family,
            fileCount: representation.fileCount,
            localStatus: representation.localStatus,
            remoteStatus: representation.remoteStatus,
          })
        }
      }

      setVersions(vArr)
      setRepresentations(rArr)
    }

    if (context.focusedVersions.length > 0) fetchData()
    else {
      setVersions(null)
      setRepresentations(null)
    }
    //eslint-disable-next-line
  }, [context.projectName, context.focusedVersions, projectName])

  return (
    <>
      <section className="row">{versions.length} versions selected.</section>

      {representations && <Representations representations={representations} />}
    </>
  )
}

const Detail = () => {
  //const dispatch = useDispatch()
  const context = useSelector((state) => ({ ...state.contextReducer }))

  let detailComponent = null

  switch (context.focusedType) {
    case 'folder':
      detailComponent = <FolderDetail />
      break
    case 'version':
      detailComponent = <VersionDetail />
      break
    default:
      break
  }

  return (
    <section className="invisible insplit">
      <section className="row invisible">
        <span className="section-header">
          {context.focusedType || 'Nothing selected'}
        </span>
        <Spacer />
        <Button icon="pi pi-bolt" disabled={true} tooltip="Mockup button" />
      </section>
      {detailComponent}
    </section>
  )
}

export default Detail
