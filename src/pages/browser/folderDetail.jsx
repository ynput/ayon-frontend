import { useSelector } from 'react-redux'
import { Panel } from '@ynput/ayon-react-components'
import Thumbnail from '/src/containers/thumbnail'
import AttributeTable from '/src/containers/attributeTable'
import { getFolderTypeIcon } from '/src/utils'
import { TagsField } from '/src/containers/fieldFormat'
import { useGetEntitiesDetailsQuery } from '../../services/ayon'
import StatusSelect from '../../components/status/statusSelect'

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

  const handleStatusChange = async (value, oldValue, entity) => {
    if (value === oldValue) return

    try {
      // create operations array of all entities
      const operations = [
        {
          type: 'update',
          entityType: 'folder',
          entityId: entity.id,
          data: {
            status: value,
          },
        },
      ]
      // TODO update entity in RTK
    } catch (error) {
      console.error(error)
    }
  }

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
          { title: 'Folder type', value: foldersData.folderType },
          {
            title: 'Status',
            value: (
              <StatusSelect
                value={foldersData.status}
                statuses={context.project.statuses}
                align={'right'}
                onChange={(v) => handleStatusChange(v, foldersData.status, foldersData)}
              />
            ),
          },
          { title: 'Tags', value: <TagsField value={foldersData.tags} /> },
          { title: 'Path', value: foldersData.path },
        ]}
      />
    </Panel>
  )
}

export default FolderDetail
