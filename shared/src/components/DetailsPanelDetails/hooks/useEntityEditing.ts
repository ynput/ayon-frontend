import { useEntityUpdate } from '@shared/hooks'
import type { DetailsPanelEntityData } from '@shared/api'

interface UseEntityEditingProps {
  entities: DetailsPanelEntityData[]
  entityType: string
}

export const useEntityEditing = ({ entities, entityType }: UseEntityEditingProps) => {
  const enableEditing = true;

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
