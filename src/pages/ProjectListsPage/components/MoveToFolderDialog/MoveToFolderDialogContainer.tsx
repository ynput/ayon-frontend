import { FC } from 'react'
import { useListsContext } from '@pages/ProjectListsPage/context'
import { useListsDataContext } from '@pages/ProjectListsPage/context/ListsDataContext'
import { MoveToFolderDialog } from './MoveToFolderDialog'

interface MoveToFolderDialogContainerProps {}

const MoveToFolderDialogContainer: FC<MoveToFolderDialogContainerProps> = ({}) => {
  const {
    moveToFolder,
    closeMoveToFolder,
    onPutListsInFolder,
    onPutFoldersInFolder,
    onRemoveListsFromFolder,
    onRemoveFoldersFromFolder,
    isReview,
    isStoryboards,
  } = useListsContext()
  const { listsData, listFolders } = useListsDataContext()

  if (!moveToFolder) return null

  const { moving, ids } = moveToFolder

  const canUnset =
    moving === 'folders'
      ? ids.some((id) => listFolders.find((folder) => folder.id === id)?.parentId)
      : ids.some((id) => listsData.find((list) => list.id === id)?.entityListFolderId)

  return (
    <MoveToFolderDialog
      moving={moving}
      ids={ids}
      isReview={isReview}
      isStoryboards={isStoryboards}
      canUnset={canUnset}
      onMove={(targetFolderId) =>
        moving === 'folders'
          ? onPutFoldersInFolder(ids, targetFolderId)
          : onPutListsInFolder(ids, targetFolderId)
      }
      onUnset={() =>
        moving === 'folders' ? onRemoveFoldersFromFolder(ids) : onRemoveListsFromFolder(ids)
      }
      onClose={closeMoveToFolder}
    />
  )
}

export default MoveToFolderDialogContainer
