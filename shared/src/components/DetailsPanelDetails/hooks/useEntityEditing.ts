import { useMemo } from 'react'
import { useEntityUpdate } from '@shared/hooks'
import type { DetailsPanelEntityData } from '@shared/api'

interface UseEntityEditingProps {
  entities: DetailsPanelEntityData[]
  entityType: string
  mixedFields: string[]
}

export const useEntityEditing = ({ entities, entityType, mixedFields }: UseEntityEditingProps) => {
  const enableEditing = useMemo(() => {
    if (
      ['task', 'folder'].includes(entityType) &&
      !mixedFields.includes('projectName')
    ) {
      return true
    }
    return false
  }, [entityType, mixedFields])

  const { updateEntity } = useEntityUpdate({
    entities: entities.map((entity) => ({
      id: entity.id,
      projectName: entity.projectName || '',
      folderId: entity.folder?.id,
      users: entity.task?.assignees || [],
    })),
    entityType,
  })

  return {
    enableEditing,
    updateEntity,
  }
}
