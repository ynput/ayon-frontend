import { useSelector } from 'react-redux'
import { Panel } from '@ynput/ayon-react-components'
import Thumbnail from '/src/containers/thumbnail'
import AttributeTable from '/src/containers/attributeTable'
import { getFolderTypeIcon } from '/src/utils'
import { StatusField, TagsField } from '/src/containers/fieldFormat'
import { useGetEntitiesDetailsQuery } from '../../services/ayon'

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
  } = useGetEntitiesDetailsQuery(
    {
      projectName,
      ids: [folderId],
      type: 'folder',
    },
    { skip: !folderId },
  )

  console.log(foldersData)

  if (isLoading) return 'loading..'

  if (isError) return 'ERROR: Something went wrong...'

  if (focusedFolders.length > 1) {
    return (
      <Panel>
        <span>{focusedFolders.length} focusedFolders selected</span>
      </Panel>
    )
  }

  const folder = foldersData[0].node

  return (
    <Panel>
      <h3>
        <span className="material-symbols-outlined" style={{ verticalAlign: 'bottom' }}>
          {getFolderTypeIcon(folder.folderType)}
        </span>
        <span style={{ marginLeft: 10 }}>{folder.name}</span>
      </h3>
      <Thumbnail projectName={projectName} entityType="folder" entityId={folderId} />
      <AttributeTable
        entityType="folder"
        data={folder.attrib}
        additionalData={[
          { title: 'Folder type', value: folder.folderType },
          { title: 'Status', value: <StatusField value={folder.status} /> },
          { title: 'Tags', value: <TagsField value={folder.tags} /> },
          { title: 'Path', value: folder.path },
        ]}
      />
    </Panel>
  )
}

export default FolderDetail
