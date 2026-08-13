import { useCallback } from 'react'
import { useProjectTableContext } from '../context/ProjectTableContext'
import { useProjectContext } from '@shared/context/ProjectContext'
import { useDeleteEntitiesContext } from '@shared/context/DeleteEntitiesContext'
import type { DeletableEntity, DeletableEntityType } from '@shared/context/DeleteEntitiesContext'
import { toast } from 'react-toastify'
import { EntityMap } from '../types'

type UseDeleteEntitiesProps = {
  onSuccess?: () => void
}

// Resolves table row ids to full entities, then hands off to the shared
// DeleteEntitiesProvider so the table shares one delete flow with the details panel.
const useDeleteEntities = ({ onSuccess }: UseDeleteEntitiesProps) => {
  const { projectName } = useProjectContext()
  const { getEntityById } = useProjectTableContext()
  const { deleteEntities } = useDeleteEntitiesContext()

  return useCallback(
    async (entityIds: string[]) => {
      if (!entityIds || entityIds.length === 0) {
        toast.error('No entities selected')
        return
      }

      const seen = new Set<string>()
      const entities: DeletableEntity[] = []
      for (const id of entityIds) {
        const entity = getEntityById(id) as (EntityMap & Record<string, any>) | undefined
        if (!entity || seen.has(entity.id)) continue
        seen.add(entity.id)

        const entityType = (entity.entityType ||
          ('folderId' in entity ? 'task' : 'folder')) as DeletableEntityType

        entities.push({
          id: entity.id,
          entityType,
          name: entity.name,
          label: entity.label,
          projectName,
          folderId: entityType === 'folder' ? undefined : entity.folderId,
          parentId: entityType === 'folder' ? entity.parentId : undefined,
          hasChildren: 'hasChildren' in entity ? entity.hasChildren : undefined,
          taskNames: 'taskNames' in entity ? entity.taskNames : undefined,
        })
      }

      if (entities.length === 0) {
        toast.error('No entities found')
        return
      }

      await deleteEntities(entities, { onSuccess })
    },
    [getEntityById, projectName, deleteEntities, onSuccess],
  )
}

export default useDeleteEntities
