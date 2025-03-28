import { CellId } from '../utils/cellUtils'
import { CellValue } from '../widgets/CellWidget'
import { OperationModel } from '@api/rest/operations'
import { PatchOperation, useUpdateOverviewEntitiesMutation } from '@queries/overview/updateOverview'
import { toast } from 'react-toastify'
import { useProjectTableContext } from '../context/ProjectTableContext'
import { useCallback } from 'react'
import { InheritedDependent } from './useFolderRelationships'

export type EntityUpdate = {
  id: string
  type: string
  field: string
  value: CellValue | CellValue[]
  isAttrib?: boolean
}
export type UpdateTableEntities = (entities: EntityUpdate[]) => Promise<void>

export type InheritFromParentEntity = {
  entityId: string
  entityType: string
  attribs: string[]
  ownAttrib: string[]
  folderId: string
}
export type InheritFromParent = (entities: InheritFromParentEntity[]) => Promise<void>

export type UpdateTableEntity = (
  cellId: CellId,
  value: string,
  { includeSelection }: { includeSelection: boolean },
) => Promise<void>

const useUpdateEditorEntities = () => {
  const {
    getEntityById,
    projectName,
    getInheritedDependents,
    findInheritedValueFromAncestors,
    findNonInheritedValues,
  } = useProjectTableContext()
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
        let { id, type, field, value, isAttrib } = entity
        // Skip unsupported entity types
        let entityType = type as OperationModel['entityType']
        if (!supportedEntityTypes.includes(entityType)) {
          continue
        }

        // create data object for change, taking into account if it's an attribute change
        const data: Record<string, any> = isAttrib
          ? { attrib: { [field]: value } }
          : { [field]: value }

        // if the entity is an attribute get the entity data
        // then update ownAttrib to include the new value
        if (isAttrib) {
          const entityData = getEntityById(id)
          const ownAttrib = [...(entityData?.ownAttrib || [])]
          // add the new value to the ownAttrib if it doesn't already exist
          if (!ownAttrib.includes(field)) {
            ownAttrib.push(field)
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

          if (existingOperation.data?.attrib && data.attrib) {
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

      const folderAttribEntities: InheritedDependent[] = operations
        .filter((op) => !!op.entityId && op.type === 'update' && op.data && 'attrib' in op.data)
        .map((op) => ({
          entityId: op.entityId as string,
          entityType: op.entityType as 'folder' | 'task',
          attrib:
            op.data && 'attrib' in op.data ? (op.data?.attrib as InheritedDependent['attrib']) : {},
        }))

      const inheritedDependents = getInheritedDependents(folderAttribEntities)

      // convert to operations
      const inheritedDependentsOperations: PatchOperation[] = inheritedDependents.map((op) => ({
        entityId: op.entityId,
        entityType: op.entityType,
        data: {
          attrib: op.attrib,
        },
      }))

      // now make api call to update all entities
      try {
        await postOperations({
          operationsRequestModel: { operations },
          projectName,
          patchOperations: inheritedDependentsOperations,
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
      const operations: OperationModel[] = [] // operations sent to the server
      const entitiesToPatch: InheritFromParentEntity[] = []
      for (const entity of entities) {
        // Skip unsupported entity types
        let entityType = entity.entityType as OperationModel['entityType']
        if (!supportedEntityTypes.includes(entityType)) {
          continue
        }
        entityType = entityType as 'task' | 'folder'

        // Create data object with null values for each attrib to inherit
        const attribData: Record<string, null> = {}
        entity.attribs.forEach((attrib) => {
          attribData[attrib] = null
        })

        // Add new operation this is what's sent to the server and is actually updated in the DB
        operations.push({
          entityType: entityType,
          entityId: entity.entityId,
          type: 'update',
          data: {
            attrib: attribData,
          },
        })

        // check if this entity has a folderId that is in entities
        // if so we check their intersection attrib names
        const findTopFolder = () => {
          // For each entity, we need to find the top-most folder in the hierarchy
          const folderId = entity.folderId

          // Find all ancestor folders that are in our entities list
          const ancestorChain: InheritFromParentEntity[] = []
          let currentFolderId = folderId
          let currentFolder = entities.find((e) => e.entityId === currentFolderId)

          // Climb up the folder hierarchy to build the chain of ancestors
          while (currentFolder) {
            ancestorChain.push(currentFolder)
            currentFolderId = currentFolder.folderId
            currentFolder = entities.find((e) => e.entityId === currentFolderId)
          }

          // The top folder is the last one in our ancestor chain (if any)
          const topFolder =
            ancestorChain.length > 0 ? ancestorChain[ancestorChain.length - 1] : null

          return topFolder
        }

        const topFolder = findTopFolder()
        const folderAttribs = topFolder?.attribs || []
        const entityAttribsIntersection = entity.attribs.filter((attrib) =>
          folderAttribs.includes(attrib),
        )
        const entityAttribsRemoved = entity.attribs.filter(
          (attrib) => !folderAttribs.includes(attrib),
        )

        // only add to patch operations if there are attribs left
        if (entityAttribsRemoved.length > 0)
          entitiesToPatch.push({
            ...entity,
            attribs: entityAttribsRemoved,
          })

        if (topFolder && entityAttribsIntersection.length > 0) {
          entitiesToPatch.push({
            ...entity,
            attribs: entityAttribsIntersection,
            folderId: topFolder.folderId,
          })
        }
      }

      const patchOperations: PatchOperation[] = [] // operations only for patching the cache
      for (const entity of entitiesToPatch) {
        const entityType = entity.entityType as 'task' | 'folder'
        // we also need to update ownAttrib to remove the inherited attribs
        const ownAttrib = [...(entity.ownAttrib || [])].filter(
          (attrib) => !entity.attribs.includes(attrib),
        )

        // now we must calculate all the entities that need to be updated in the cache
        // first we need to find the the ancestor folder to inherit from
        const ancestorAttrib = findNonInheritedValues(entity.folderId, entity.attribs)

        const entityPatch = {
          entityId: entity.entityId,
          entityType: entityType,
          data: {
            attrib: ancestorAttrib,
            ownAttrib: ownAttrib,
          },
        }

        // create new patch operation for the entity
        patchOperations.push(entityPatch)

        // now find any dependent that also need updating
        const inheritedDependents = getInheritedDependents([
          { entityId: entity.entityId, entityType: entityType, attrib: ancestorAttrib },
        ])

        // convert to operations
        const inheritedDependentsOperations: PatchOperation[] = inheritedDependents.map((op) => ({
          entityId: op.entityId,
          entityType: op.entityType,
          data: {
            attrib: op.attrib,
          },
        }))

        // try to add to patch operations
        // if it already exists then merge the attribs
        for (const inheritedDependent of inheritedDependentsOperations) {
          const existingOperationIndex = patchOperations.findIndex(
            (op) => op.entityId === inheritedDependent.entityId,
          )

          if (existingOperationIndex !== -1) {
            // Merge attribs with existing operation
            const existingOperation = patchOperations[existingOperationIndex]
            let newAttrib = {
              ...(existingOperation.data?.attrib || {}),
              ...(inheritedDependent.data?.attrib || {}),
            }

            patchOperations[existingOperationIndex] = {
              ...existingOperation,
              data: { attrib: newAttrib },
            }
          } else {
            // Add new operation
            patchOperations.push({
              entityId: inheritedDependent.entityId,
              entityType: inheritedDependent.entityType,
              data: inheritedDependent.data,
            })
          }
        }
      }

      // now make api call to update all entities
      try {
        await postOperations({
          operationsRequestModel: { operations },
          projectName,
          patchOperations: patchOperations,
        }).unwrap()
      } catch (error) {
        toast.error('Failed to update entities')
      }
    },
    [projectName, postOperations, getInheritedDependents, findInheritedValueFromAncestors],
  )

  return { updateEntities, inheritFromParent }
}

export default useUpdateEditorEntities
