import { toast } from 'react-toastify'
import { useUpdateEntitiesMutation } from '@shared/api'

interface Entity {
  id: string
  projectName: string
  users: string[]
  folderId?: string
  productId?: string
}

export interface UseEntityUpdateParams {
  entities: Entity[]
  entityType: string
}

/**
 * Hook for updating entities with proper error handling and version-specific logic
 */
export const useEntityUpdate = ({ entities, entityType }: UseEntityUpdateParams) => {
  const [updateEntities] = useUpdateEntitiesMutation()

  /**
   * Updates entities with the specified field and value
   * @param field The field to update
   * @param value The new value for the field
   * @returns Promise that resolves when the update is complete
   */
  const updateEntity = async (field: string, value: any): Promise<void> => {
    if (value === null || value === undefined) {
      console.error('value is null or undefined')
      return
    }

    try {
      // Build entities operations array
      const operations = entities.map((entity) => ({
        id: entity.id,
        projectName: entity.projectName,
        data: {
          [field]: value,
        },
        currentAssignees: entity.users,
        meta: {
          folderId: entity.folderId,
        },
      }))

      await updateEntities({ operations, entityType })
    } catch (error) {
      toast.error(`Error updating ${entityType}`)
    }
  }

  return { updateEntity }
}
