import { CellId } from '../utils/cellUtils'
import { CellValue } from '../widgets/CellWidget'
import { OperationModel } from '@api/rest/operations'
import { useUpdateOverviewEntitiesMutation } from '@queries/overview/updateOverview'
import { toast } from 'react-toastify'
import { useProjectTableContext } from '../context/ProjectTableContext'
import { useCallback } from 'react'

export type EntityUpdate = {
  id: string
  type: string
  field: string
  value: CellValue | CellValue[]
  isAttrib?: boolean
}
export type UpdateTableEntities = (entities: EntityUpdate[]) => Promise<void>

export type InheritFromParent = (
  entities: { id: string; type: string; attribs: string[] }[],
) => Promise<void>

export type UpdateTableEntity = (
  cellId: CellId,
  value: string,
  { includeSelection }: { includeSelection: boolean },
) => Promise<void>

const useUpdateEditorEntities = () => {
  const { getEntityById, projectName, getInheritedDependents } = useProjectTableContext()
  const [postOperations] = useUpdateOverviewEntitiesMutation()

  const updateEntities = useCallback<UpdateTableEntities>(
    async (entities = []) => {
      if (!entities.length || !projectName) {
        return
      }

      const supportedEntityTypes: OperationModel['entityType'][] = ['task', 'folder']
      // Group operations by entity type for bulk processing
      let operations: OperationModel[] = []
      for (const entity of entities) {
        // Skip unsupported entity types
        let entityType = entity.type as OperationModel['entityType']
        if (!supportedEntityTypes.includes(entityType)) {
          continue
        }

        // create data object for change, taking into account if it's an attribute change
        const data: Record<string, any> = entity.isAttrib
          ? { attrib: { [entity.field]: entity.value } }
          : { [entity.field]: entity.value }

        // if the entity is an attribute get the entity data
        // then update ownAttrib to include the new value
        if (entity.isAttrib) {
          const entityData = getEntityById(entity.id)
          const ownAttrib = [...(entityData?.ownAttrib || [])]
          // add the new value to the ownAttrib if it doesn't already exist
          if (!ownAttrib.includes(entity.field)) {
            ownAttrib.push(entity.field)
          }
          // update the data object with the new ownAttrib
          data.ownAttrib = ownAttrib
        }

        const existingOperationIndex = operations.findIndex(
          (op) => op.entityId === entity.id && op.entityType === entityType,
        )

        if (existingOperationIndex !== -1) {
          // Merge data with existing operation
          const existingOperation = operations[existingOperationIndex]
          let newData = { ...existingOperation.data, ...data }

          // @ts-expect-error
          if (existingOperation.data?.attrib && data.attrib) {
            // @ts-expect-error
            newData = { ...newData, attrib: { ...existingOperation.data.attrib, ...data.attrib } }
          }

          operations[existingOperationIndex] = {
            ...existingOperation,
            data: newData,
          }
        } else {
          // Add new operation
          operations.push({
            entityType: entityType,
            entityId: entity.id,
            type: 'update',
            data: data,
          })
        }
      }

      const folderAttribEntities = operations
        .filter(
          (op) =>
            !!op.entityId &&
            op.type === 'update' &&
            op.entityType === 'folder' &&
            op.data &&
            'attrib' in op.data,
        )
        .map((op) => ({
          id: op.entityId as string,
          attribs: Object.keys((op.data as { attrib: Record<string, unknown> }).attrib || {}),
        }))

      const inheritedDependents = getInheritedDependents(folderAttribEntities)

      console.log({ inheritedDependents })

      // now make api call to update all entities
      try {
        await postOperations({
          operationsRequestModel: { operations },
          projectName,
          inheritedDependents,
        }).unwrap()
      } catch (error) {
        toast.error('Failed to update entities')
      }
    },
    [projectName, postOperations, getEntityById, getInheritedDependents],
  )

  // set the attrib fields to be inherited from the parent
  // (remove the field from the ownAttrib array)
  // invalidate the cache for the folder/task so that it can be re-fetched with inherited values
  const inheritFromParent = useCallback<InheritFromParent>(
    async (entities) => {
      if (!entities.length || !projectName) {
        return
      }

      const supportedEntityTypes: OperationModel['entityType'][] = ['task', 'folder']
      // Group operations by entity type for bulk processing
      let operations: OperationModel[] = []
      for (const entity of entities) {
        // Skip unsupported entity types
        let entityType = entity.type as OperationModel['entityType']
        if (!supportedEntityTypes.includes(entityType)) {
          continue
        }

        // Create data object with null values for each attrib to inherit
        const attribData: Record<string, null> = {}
        entity.attribs.forEach((attrib) => {
          attribData[attrib] = null
        })

        // Add new operation
        operations.push({
          entityType: entityType,
          entityId: entity.id,
          type: 'update',
          data: {
            attrib: attribData,
          },
        })
      }

      const folderAttribEntities = operations
        .filter(
          (op) =>
            !!op.entityId &&
            op.type === 'update' &&
            op.entityType === 'folder' &&
            op.data &&
            'attrib' in op.data,
        )
        .map((op) => ({
          id: op.entityId as string,
          attribs: Object.keys((op.data as { attrib: Record<string, unknown> }).attrib || {}),
        }))

      const inheritedDependents = getInheritedDependents(folderAttribEntities)

      // add itself to inherited dependents
      for (const op of operations) {
        inheritedDependents.push({
          entityId: op.entityId as string,
          entityType: op.entityType as 'folder' | 'task',
          inheritedAttribs: Object.keys(
            (op.data as { attrib: Record<string, unknown> }).attrib || {},
          ),
        })
      }

      // now make api call to update all entities
      try {
        await postOperations({
          operationsRequestModel: { operations },
          projectName,
          inheritedDependents,
        }).unwrap()
      } catch (error) {
        toast.error('Failed to update entities')
      }
    },
    [projectName, postOperations, getInheritedDependents],
  )

  return { updateEntities, inheritFromParent }
}

export default useUpdateEditorEntities
