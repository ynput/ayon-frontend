import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useFetch } from 'use-http'

import axios from 'axios'

import { Button, Spacer, FolderTypeIcon } from '../../components'

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
                          #FOLDER_ATTRS#
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

const buildFolderQuery = (attributes) => {
  let f_attribs = ''
  for (const attrib of attributes) {
    if (attrib.scope.includes('folder')) f_attribs += `${attrib.name}\n`
  }
  return FOLDER_QUERY.replace('#FOLDER_ATTRS#', f_attribs)
}

const FolderDetail = () => {
  const context = useSelector((state) => ({ ...state.contextReducer }))
  const settings = useSelector((state) => ({ ...state.settingsReducer }))
  const projectName = context.projectName
  const folders = context.focusedFolders
  const folderId = folders.length > 0 ? folders[folders.length - 1] : null
  const [data, setData] = useState({})

  useEffect(() => {
    const query = buildFolderQuery(settings.attributes)
    const variables = { projectName, folders: [folderId] }

    axios.post('/graphql', { query, variables }).then((response) => {
      if (!(response.data.data && response.data.data.project)) {
        console.log('ERROR', data.errors[0].message)
        return
      }

      console.log(response.data.data.project)
      const edges = response.data.data.project.folders.edges
      if (!edges.length) {
        // TODO: log 404
        return
      }

      setData(edges[0].node)
    })
    //eslint-disable-next-line
  }, [projectName, folderId])

  return (
    <section style={{ flexGrow: 1 }}>
      <h3>
        <FolderTypeIcon name={data.folderType} />
        <span style={{ marginLeft: 15 }}>{data.name}</span>
      </h3>
      <h4>Attributes</h4>
      <table>
        {data.attrib &&
          settings.attributes
            .filter(
              (attr) => attr.scope.includes('folder') && data.attrib[attr.name]
            )
            .map((attr) => (
              <tr>
                <td>{attr.title}</td>
                <td>{data.attrib[attr.name]}</td>
              </tr>
            ))}
      </table>
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
