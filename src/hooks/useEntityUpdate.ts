import { toast } from 'react-toastify'
import { useUpdateEntitiesMutation } from '@queries/entity/updateEntity'
import usePatchProductsListWithVersions from '@hooks/usePatchProductsListWithVersions'

interface Entity {
  id: string
  projectName: string
  users: string[]
  folderId?: string
  productId?: string
}

interface UpdateEntityParams {
  entities: Entity[]
  entityType: string
  projectName?: string | null
}

/**
 * Hook for updating entities with proper error handling and version-specific logic
 */
export const useEntityUpdate = ({ entities, entityType, projectName }: UpdateEntityParams) => {
  const [updateEntities] = useUpdateEntitiesMutation()

  const patchProductsListWithVersions = usePatchProductsListWithVersions({
    projectName: projectName || undefined,
  })

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

    // Handle products list patching for versions
    const productsPatch = patchProductsVersions(field, value)

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
      productsPatch?.undo()
    }
  }

  /**
   * For version entities, update the products list with version changes
   */
  const patchProductsVersions = (field: string, value: any) => {
    let productsPatch
    // If the type is version and the field is status, patch products list
    if (entityType === 'version' && ['status'].includes(field)) {
      const versions = entities.map((version) => ({
        productId: version.productId,
        versionId: version.id,
        versionStatus: value,
      }))

      // Update productsList cache with new status
      productsPatch = patchProductsListWithVersions(versions)
    }

    return productsPatch
  }

  return { updateEntity }
}

export default useEntityUpdate
