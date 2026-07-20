import { FC, useCallback } from 'react'
import { EntityPickerDialog } from '@shared/containers/EntityPickerDialog'
import { useOptionalProjectTableContext } from '@shared/containers/ProjectTreeTable'
import { EntityMoveData } from '@shared/context/MoveEntityContext'
import { useMoveEntities } from '@shared/containers/ProjectTreeTable/hooks/useMoveEntities'

interface MoveEntityDialogProps {
  projectName: string
}

export const MoveEntityDialog: FC<MoveEntityDialogProps> = ({ projectName }) => {
  const projectTableContext = useOptionalProjectTableContext()
  const {
    isEntityPickerOpen,
    handleMoveSubmit,
    closeMoveDialog,
    movingEntities,
    handleMoveToRoot,
    getDisabledFolderIds,
    getDisabledMessage,
  } = useMoveEntities({ projectName })

  const handleMoveSubmitWithExpand = useCallback(
    (selection: string[]) => {
      handleMoveSubmit(selection)
      const folderIdToExpand = selection[0]
      if (!folderIdToExpand || !projectTableContext) return

      projectTableContext.updateExpanded((prevExpanded) => {
        if (typeof prevExpanded === 'boolean') {
          return prevExpanded ? prevExpanded : { [folderIdToExpand]: true }
        }
        if (prevExpanded[folderIdToExpand]) return prevExpanded
        return { ...prevExpanded, [folderIdToExpand]: true }
      })
    },
    [handleMoveSubmit, projectTableContext],
  )

  if (!isEntityPickerOpen || !movingEntities?.entities?.length) {
    return null
  }

  return (
    <EntityPickerDialog
      projectName={projectName}
      entityType="folder"
      onSubmit={handleMoveSubmitWithExpand}
      onClose={closeMoveDialog}
      showMoveToRoot={movingEntities.entities.every(
        (entity: EntityMoveData) => entity.entityType === 'folder',
      )}
      onMoveToRoot={handleMoveToRoot}
      disabledIds={getDisabledFolderIds()}
      getDisabledMessage={getDisabledMessage}
    />
  )
}
