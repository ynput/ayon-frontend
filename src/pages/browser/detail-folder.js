import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import axios from 'axios'

import { FolderTypeIcon } from '../../components'
import Thumbnail from '../../containers/thumbnail'

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
      <Thumbnail
        projectName={projectName}
        entityType="folder"
        entityId={folderId}
      />
      <h4 style={{ marginTop: 10 }}>Attributes</h4>
      <table>
        <tbody>
          {data.attrib &&
            settings.attributes
              .filter(
                (attr) =>
                  attr.scope.includes('folder') && data.attrib[attr.name]
              )
              .map((attr) => (
                <tr key={attr.name}>
                  <td>{attr.title}</td>
                  <td>{data.attrib[attr.name]}</td>
                </tr>
              ))}
        </tbody>
      </table>
    </section>
  )
}

export default FolderDetail
