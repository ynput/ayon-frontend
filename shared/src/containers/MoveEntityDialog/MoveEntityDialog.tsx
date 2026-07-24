import { FC } from 'react'
import { EntityPickerDialog } from '@shared/containers/EntityPickerDialog'
import { useMoveEntities } from '@shared/containers/ProjectTreeTable/hooks/useMoveEntities'
import { EntityMoveData, MultiEntityMoveData, OnMoveComplete } from './types'

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
  const { handleMoveSubmit, handleMoveToRoot, getDisabledFolderIds, getDisabledMessage } =
    useMoveEntities({
      projectName,
      movingEntities: movingEntities ?? null,
      onClose,
      onMoveComplete,
    })

  if (!movingEntities?.entities.length) {
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
      getDisabledMessage={getDisabledMessage}
    />
  )
}
