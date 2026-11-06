import { FC, useMemo } from 'react'
import { EntityPickerDialog } from '@shared/containers/EntityPickerDialog/EntityPickerDialog'
import { useMoveEntities } from '@shared/containers/ProjectTreeTable/hooks/useMoveEntities'
import { readSessionStorage, writeSessionStorage } from '@shared/hooks/useSessionStorage'
import { useProjectFoldersContext } from '@shared/context'
import type { EntityMoveData, MultiEntityMoveData, OnMoveComplete } from './types'

interface MoveEntityDialogProps {
  projectName: string
  movingEntities: MultiEntityMoveData | null
  onClose: () => void
  onMoveComplete?: OnMoveComplete
}

// the folder things were last moved to, per project, for the rest of the browser session:
// moving several entities to the same place should not mean finding that folder each time
const destinationKey = (projectName: string) => `dialog-memory:move-entity:${projectName}`

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
      onMoveComplete: (targetFolderId) => {
        writeSessionStorage(destinationKey(projectName), targetFolderId)
        onMoveComplete?.(targetFolderId)
      },
    })

  // read on each opening (the dialog stays mounted), so the picker starts on the last destination
  const { folders } = useProjectFoldersContext()
  const lastDestination = useMemo(() => {
    if (!movingEntities) return null
    const id = readSessionStorage<string | null>(destinationKey(projectName), null)
    // the folder may have been deleted since
    return id && folders.some((folder) => folder.id === id) ? id : null
  }, [movingEntities, projectName, folders])

  if (!movingEntities?.entities.length) {
    return null
  }

  const disabledIds = getDisabledFolderIds()
  // not when it is a folder being moved, one that would clash by name, or where they already are
  const initialFolder =
    lastDestination &&
    !disabledIds.includes(lastDestination) &&
    !movingEntities.entities.some((entity) => entity.currentParentId === lastDestination)
      ? lastDestination
      : undefined

  return (
    <EntityPickerDialog
      // the picker reads its initial selection on mount: remount if the destination resolves later (folders still loading)
      key={initialFolder ?? 'no-destination'}
      projectName={projectName}
      entityType="folder"
      onSubmit={handleMoveSubmit}
      onClose={onClose}
      showMoveToRoot={movingEntities.entities.every(
        (entity: EntityMoveData) => entity.entityType === 'folder',
      )}
      onMoveToRoot={handleMoveToRoot}
      disabledIds={disabledIds}
      initialSelection={initialFolder ? { folder: { [initialFolder]: true } } : undefined}
      getDisabledMessage={getDisabledMessage}
    />
  )
}
