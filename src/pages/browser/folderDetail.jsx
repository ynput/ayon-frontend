import ayonClient from '/src/ayon'

import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'

import { Panel } from '@ynput/ayon-react-components'

import Thumbnail from '/src/containers/thumbnail'
import AttributeTable from '/src/containers/attributeTable'
import { getFolderTypeIcon } from '/src/utils'

import { TagsField } from '/src/containers/fieldFormat'
import { setReload } from '../../features/context'
import StatusSelect from '../../components/status/statusSelect'

const FOLDER_QUERY = `
    query Folders($projectName: String!, $folders: [String!]!) {
        project(name: $projectName) {
            folders(ids: $folders) {
                edges {
                    node {
                        name
                        folderType
                        path
                        status
                        tags
                        attrib {
                          #FOLDER_ATTRS#
                        }
                    }
                }
            }
        }
    }

`

const buildFolderQuery = () => {
  let f_attribs = ''
  for (const attrib of ayonClient.settings.attributes) {
    if (attrib.scope.includes('folder')) f_attribs += `${attrib.name}\n`
  }
  return FOLDER_QUERY.replace('#FOLDER_ATTRS#', f_attribs)
}

const FolderDetail = () => {
  const dispatch = useDispatch()
  const context = useSelector((state) => ({ ...state.context }))
  const projectName = context.projectName
  const folders = context.focused.folders
  const folderId = folders.length === 1 ? folders[0] : null

  const [data, setData] = useState({})

  const getFolderData = () => {
    const query = buildFolderQuery()
    const variables = { projectName, folders: [folderId] }

    if (!folderId) {
      setData({})
      return
    }

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
  }

  // get data for folder on mount and folder change
  useEffect(() => {
    getFolderData()
    //eslint-disable-next-line
  }, [projectName, folderId])

  // get reload trigger for type = "folder"
  const reload = context.reload.folder

  // reload data on redux trigger (eg: updating tags)
  useEffect(() => {
    if (reload) {
      console.log('reloading folder data')
      // reload data for folder
      getFolderData(projectName, folderId)
      // reset reload trigger
      dispatch(setReload({ type: 'folder', reload: false }))
    }
    //eslint-disable-next-line
  }, [reload])

  if (folders.length > 1) {
    return (
      <Panel>
        <span>{folders.length} folders selected</span>
      </Panel>
    )
  }

  return (
    <Panel>
      <h3>
        <span className="material-symbols-outlined" style={{ verticalAlign: 'bottom' }}>
          {getFolderTypeIcon(data.folderType)}
        </span>
        <span style={{ marginLeft: 10 }}>{data.name}</span>
      </h3>
      <Thumbnail projectName={projectName} entityType="folder" entityId={folderId} />
      <AttributeTable
        entityType="folder"
        data={data.attrib}
        additionalData={[
          { title: 'Folder type', value: data.folderType },
          {
            title: 'Status',
            value: <StatusSelect value={data.status} statuses={context.project.statuses} />,
          },
          { title: 'Tags', value: <TagsField value={data.tags} /> },
          { title: 'Path', value: data.path },
        ]}
      />
    </Panel>
  )
}

export default FolderDetail
