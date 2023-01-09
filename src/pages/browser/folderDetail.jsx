import { useSelector } from 'react-redux'
import { Panel } from '@ynput/ayon-react-components'
import Thumbnail from '/src/containers/thumbnail'
import AttributeTable from '/src/containers/attributeTable'
import { getFolderTypeIcon } from '/src/utils'
import { TagsField } from '/src/containers/fieldFormat'
import { useGetEntitiesDetailsQuery, useUpdateEntitiesDetailsMutation } from '../../services/ayon'
import StatusSelect from '../../components/status/statusSelect'
import { useEffect } from 'react'
// import { useContext } from 'react'
// import { SocketContext } from '../../context/websocketContext'
import PubSub from '/src/pubsub'

const FolderDetail = () => {
  const context = useSelector((state) => ({ ...state.context }))
  const projectName = context.projectName
  const focusedFolders = context.focused.folders
  const folderId = focusedFolders.length === 1 ? focusedFolders[0] : null

  // GET RTK QUERY
  const {
    data: foldersData,
    isError,
    isLoading,
    refetch,
  } = useGetEntitiesDetailsQuery(
    {
      projectName,
      ids: [folderId],
      type: 'folder',
    },
    { skip: !folderId },
  )

  // WEIRD WAY OF DOING IT
  // const { getWebSocket, readyState } = useContext(SocketContext)

  // const onMessage = (message) => {
  //   const data = JSON.parse(message.data)
  //   if (data.summary.entityId === folderId) {
  //     console.log('Refecting data for folder: ', foldersData[0].node.name)
  //     refetch()
  //   }
  // }

  // useEffect(() => {
  //   if (readyState === ReadyState.OPEN) {
  //     getWebSocket().onmessage = onMessage
  //   }
  // }, [readyState, getWebSocket, folderId])

  // // PUBSUB V1
  // useEffect(() => {
  //   const token = PubSub.subscribe('entity.folder', () => console.log('subbed'))
  //   return () => PubSub.unsubscribe(token)
  // }, [])

  // TODO Create custom hook and use debounce for multiple messages
  // DEBOUNCED WAY
  const handlePubSub = (topic, message) => {
    if (folderId !== message.summary.entityId) return
    console.log('WS Version Refetch', topic)

    refetch()
  }

  useEffect(() => {
    const token = PubSub.subscribe('entity.folder', handlePubSub)
    return () => PubSub.unsubscribe(token)
  }, [folderId])

  // PATCH FOLDERS DATA
  const [updateFolder] = useUpdateEntitiesDetailsMutation()

  if (isLoading) return 'loading..'

  if (isError) return 'ERROR: Something went wrong...'

  const handleStatusChange = async (value, entity) => {
    try {
      const patches = [{ ...entity, status: value }]

      const payload = await updateFolder({
        projectName,
        type: 'folder',
        data: { status: value },
        patches,
      }).unwrap()

      console.log('fulfilled', payload)
    } catch (error) {
      console.error('rejected', error)
    }
  }

  const folder = foldersData[0].node

  if (focusedFolders.length > 1) {
    return (
      <Panel>
        <span>{focusedFolders.length} focusedFolders selected</span>
      </Panel>
    )
  }

  return (
    <Panel>
      <h3>
        <span className="material-symbols-outlined" style={{ verticalAlign: 'bottom' }}>
          {getFolderTypeIcon(folder.folderType)}
        </span>
        <span style={{ marginLeft: 10 }}>{folder.label || folder.name}</span>
      </h3>
      <Thumbnail projectName={projectName} entityType="folder" entityId={folderId} />
      <AttributeTable
        entityType="folder"
        data={folder.attrib}
        additionalData={[
          { title: 'Folder type', value: folder.folderType },
          {
            title: 'Status',
            value: (
              <StatusSelect
                value={folder.status}
                statuses={context.project.statuses}
                align={'right'}
                onChange={(v) => handleStatusChange(v, folder)}
              />
            ),
          },
          { title: 'Tags', value: <TagsField value={folder.tags} /> },
          { title: 'Path', value: folder.path },
        ]}
      />
    </Panel>
  )
}

export default FolderDetail
