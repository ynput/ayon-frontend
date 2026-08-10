import { FC } from 'react'
import { useListsContext } from '@pages/ProjectListsPage/context'
import { MoveToFolderDialog } from './MoveToFolderDialog'

interface MoveToFolderDialogContainerProps {}

const MoveToFolderDialogContainer: FC<MoveToFolderDialogContainerProps> = ({}) => {
  const {
    moveToFolder,
    closeMoveToFolder,
    onPutListsInFolder,
    onPutFoldersInFolder,
    isReview,
    isStoryboards,
  } = useListsContext()

  if (!moveToFolder) return null

  const { moving, ids } = moveToFolder

  return (
    <MoveToFolderDialog
      moving={moving}
      ids={ids}
      isReview={isReview}
      isStoryboards={isStoryboards}
      onMove={(targetFolderId) =>
        moving === 'folders'
          ? onPutFoldersInFolder(ids, targetFolderId)
          : onPutListsInFolder(ids, targetFolderId)
      }
      onClose={closeMoveToFolder}
    />
  )
}

export default MoveToFolderDialogContainer
