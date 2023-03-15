import { useSelector } from 'react-redux'
import { Panel } from '@ynput/ayon-react-components'
import Thumbnail from '/src/containers/thumbnail'
import AttributeTable from '/src/containers/attributeTable'
import { TagsField } from '/src/containers/fieldFormat'
import { useUpdateEntitiesDetailsMutation } from '../../../services/entity/updateEntity'
import { useGetEntitiesDetailsQuery } from '../../../services/entity/getEntity'
import StatusSelect from '/src/components/status/StatusSelect'
import usePubSub from '/src/hooks/usePubSub'

const FolderDetail = () => {
  const folders = useSelector((state) => state.project.folders)
  const projectName = useSelector((state) => state.project.name)
  const focusedFolders = useSelector((state) => state.context.focused.folders)
  const folderId = focusedFolders.length === 1 ? focusedFolders[0] : null

  // GET RTK QUERY
  const {
    data: foldersData = [],
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

  // PUBSUB HOOK
  usePubSub('entity.folder', refetch, focusedFolders)

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

  const folder = foldersData[0]?.node

  if (!folder) return null

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
          {folders[folder.folderType]?.icon || 'folder'}
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
