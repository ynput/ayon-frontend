import { FC } from 'react'
import { EntityPickerDialog } from '@shared/containers/EntityPickerDialog/EntityPickerDialog'
import { useMoveEntities } from '@shared/containers/ProjectTreeTable/hooks/useMoveEntities'
import type { EntityMoveData, MultiEntityMoveData, OnMoveComplete } from './types'

interface MoveEntityDialogProps {
  projectName: string
  movingEntities: MultiEntityMoveData | null
  onClose: () => void
  onMoveComplete?: OnMoveComplete
}

export const MoveEntityDialog: FC<MoveEntityDialogProps> = ({
  projectName,
  movingEntities,
  onClose,
  onMoveComplete,
}) => {
  const {
    isLoadingFolders,
    lastDestinationId,
    handleMoveSubmit,
    handleMoveToRoot,
    getDisabledFolderIds,
    getDisabledMessage,
  } = useMoveEntities({
    projectName,
    movingEntities: movingEntities ?? null,
    onClose,
    onMoveComplete,
  })

  // the picker reads its initial selection on mount, so wait for the folders to know the last destination
  if (!movingEntities?.entities.length || isLoadingFolders) {
    return null
  }

  return (
    <EntityPickerDialog
      projectName={projectName}
      entityType="folder"
      onSubmit={handleMoveSubmit}
      onClose={onClose}
      showMoveToRoot={movingEntities.entities.every(
        (entity: EntityMoveData) => entity.entityType === 'folder',
      )}
      onMoveToRoot={handleMoveToRoot}
      disabledIds={getDisabledFolderIds()}
      initialSelection={lastDestinationId ? { folder: { [lastDestinationId]: true } } : undefined}
      getDisabledMessage={getDisabledMessage}
    />
  )
}
