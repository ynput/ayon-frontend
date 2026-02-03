import { CellId } from '../utils/cellUtils'
import { CellValue } from '../widgets/CellWidget'
import { toast } from 'react-toastify'
import { useProjectTableQueriesContext } from '../context/ProjectTableQueriesContext'
import { useCallback } from 'react'
import { InheritedDependent } from './useFolderRelationships'
import { useProjectTableContext } from '../context/ProjectTableContext'
import { OperationModel } from '../types/operations'
import { PatchOperation } from '../types'
import { HistoryEntityUpdate, UseHistoryReturn } from './useHistory'
import { useProjectContext } from '@shared/context'

const getErrorMessage = (
  errorCode: string | undefined,
  entityType: string,
  entityName: string,
): string => {
  switch (errorCode) {
    case 'unique-violation':
      return `${entityType} with the name "${entityName}" already exists`
    case 'not-null-violation':
      return `${entityType} "${entityName}" is missing required fields`
    case 'foreign-key-violation':
      return `${entityType} "${entityName}" references invalid data`
    case 'integrity-constraint-violation':
      return `${entityType} "${entityName}" violates data integrity rules`
    default:
      return `Failed to update ${entityType}: ${entityName}`
  }
}

export type EntityUpdate = {
  rowId: string
  id: string
  type: string
  field: string
  value: CellValue | CellValue[] | null
  isAttrib?: boolean
  isLink?: boolean // link updates use different endpoint
  meta?: Record<string, any>
}
export type UpdateTableEntities = (entities: EntityUpdate[], pushHistory?: boolean) => Promise<void>

export type InheritFromParentEntity = {
  rowId: string
  entityId: string
  entityType: string
  attribs: string[]
  ownAttrib: string[]
  folderId?: string // the parent folder ID
  meta?: Record<string, any>
}
export type InheritFromParent = (
  entities: InheritFromParentEntity[],
  pushHistory?: boolean,
) => Promise<void>

export type UpdateTableEntity = (
  cellId: CellId,
  value: string,
  { includeSelection }: { includeSelection: boolean },
) => Promise<void>

export type OperationWithRowId = OperationModel & { rowId: string; meta?: Record<string, any> }

interface UseUpdateTableDataProps {
  pushHistory?: UseHistoryReturn['pushHistory']
  removeHistoryEntries?: UseHistoryReturn['removeHistoryEntries']
}

const useUpdateTableData = (props?: UseUpdateTableDataProps) => {
  const { pushHistory, removeHistoryEntries } = props || {}
  const { projectName } = useProjectContext()
  const {
    getEntityById,
    getInheritedDependents,
    findInheritedValueFromAncestors,
    findNonInheritedValues,
  } = useProjectTableContext()
  const { updateEntities } = useProjectTableQueriesContext()

  const handleUpdateEntities = useCallback<UpdateTableEntities>(
    async (entities = [], pushToHistory = true) => {
      if (!entities.length || !projectName) {
        return
      }

      // Filter out link updates - they should be handled by useUpdateTableLinks
      let entityUpdates = entities.filter((e) => !e.isLink)

      // Filter out folder type updates for folders with versions
      const filteredUpdates = entityUpdates.filter((entity) => {
        if (entity.field === 'folderType' && entity.type === 'folder') {
          const entityData = getEntityById(entity.id)
          if (entityData?.hasVersions) {
            return false
          }
        }
        return true
      })

      // Show warning if any updates were filtered out
      const filteredCount = entityUpdates.length - filteredUpdates.length
      if (filteredCount > 0) {
        toast.error(
          `Cannot change folder type for ${filteredCount} folder${
            filteredCount > 1 ? 's' : ''
          } with published versions`,
        )
      }

      entityUpdates = filteredUpdates

      // If no entity updates to process, return early
      if (!entityUpdates.length) {
        return
      }

      // Record history of previous values before applying update
      if (pushHistory && pushToHistory) {
        const inverseEntities: HistoryEntityUpdate[] = entityUpdates.map(
          ({ rowId, id, type, field, isAttrib, meta }) => {
            const entityData = getEntityById(id) as Record<string, any>
            if (!entityData) {
              throw 'Entity not found: ' + id
            }
            const entityId = entityData?.entityId || entityData.id
            const oldValue = isAttrib
              ? (entityData.attrib as Record<string, any>)?.[field] ?? null
              : entityData[field] ?? null

            // Check if the field was inherited (not in ownAttrib)
            const ownAttrib = entityData?.ownAttrib || []
            const wasInherited = isAttrib && !ownAttrib.includes(field)

            return {
              rowId: rowId,
              id: entityId,
              type,
              field,
              value: oldValue,
              isAttrib,
              wasInherited, // Track inheritance status for undo
              ownAttrib: ownAttrib,
              folderId: entityData?.folderId || entityData?.parentId,
              meta,
            }
          },
        )
        const historyEntities: HistoryEntityUpdate[] = entityUpdates.flatMap(
          ({ rowId, id, type, field, value, isAttrib, meta }) => {
            const entityData = getEntityById(id)
            const entityId = entityData?.entityId || entityData?.id || id

            if (!entityData) return []

            return {
              rowId: rowId,
              id: entityId,
              type,
              field,
              value,
              isAttrib,
              ownAttrib: entityData?.ownAttrib || [],
              folderId: 'folderId' in entityData ? entityData.folderId : entityData?.parentId,
              meta,
            }
          },
        )
        pushHistory(inverseEntities, historyEntities)
      }

      const supportedEntityTypes: OperationModel['entityType'][] = [
        'task',
        'folder',
        'product',
        'version',
      ]
      // Group operations by entity type for bulk processing
      let operations: OperationWithRowId[] = []
      for (const entity of entityUpdates) {
        let { id, type, field, value, isAttrib, meta } = entity
        const entityData = getEntityById(id)
        const entityId = entityData?.entityId || entityData?.id || id
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
          const ownAttrib = [...(entityData?.ownAttrib || [])]
          // add the new value to the ownAttrib if it doesn't already exist
          if (!ownAttrib.includes(field)) {
            ownAttrib.push(field)
          }
          // update the data object with the new ownAttrib
          data.ownAttrib = ownAttrib
        }

        const existingOperationIndex = operations.findIndex(
          (op) => op.entityId === entityId && op.entityType === entityType,
        )

        if (existingOperationIndex !== -1) {
          // Merge data with existing operation
          const existingOperation = operations[existingOperationIndex]
          let newData = { ...existingOperation.data, ...data }

          // @ts-ignore
          if (existingOperation.data?.attrib && data.attrib) {
            // @ts-ignore
            newData = { ...newData, attrib: { ...existingOperation.data.attrib, ...data.attrib } }
          }

          operations[existingOperationIndex] = {
            ...existingOperation,
            data: newData,
          }
        } else {
          // Add new operation
          operations.push({
            rowId: entity.rowId,
            entityType: entityType,
            entityId: entityId,
            type: 'update',
            data: data,
            meta: meta,
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

      // now make api call to update all entities and links
      try {
        if (operations.length) {
          await updateEntities({
            operations,
            patchOperations: inheritedDependentsOperations,
          })
        }
      } catch (error: any) {
        console.error('Error updating entities:', error)
        if (operations.length === 1) {
          error.errorCodes.forEach((errorCode: string) => {
            const op = operations[0]
            const entity = getEntityById(op.entityId as string)
            const entityName = entity?.label || entity?.name || op.entityId || ''
            const message = getErrorMessage(errorCode, op.entityType, entityName)
            toast.error(message)
          })
        } else {
          toast.error('Failed to update entities')
        }
        // Remove the failed update from history stack
        if (pushHistory && pushToHistory && removeHistoryEntries) {
          removeHistoryEntries(1)
        }
      }
    },
    [
      projectName,
      updateEntities, //
      getEntityById,
      getInheritedDependents,
      pushHistory,
      removeHistoryEntries,
    ],
  )

  // set the attrib fields to be inherited from the parent
  // (remove the field from the ownAttrib array)
  // invalidate the cache for the folder/task so that it can be re-fetched with inherited values
  const inheritFromParent = useCallback<InheritFromParent>(
    async (entities, pushToHistory = true) => {
      if (!entities.length || !projectName) {
        return
      }

      // Record history for the inheritance operation
      if (pushToHistory && pushHistory) {
        // Create undo entities (restore explicit values)
        const undoEntities: HistoryEntityUpdate[] = []

        // For each entity and attribute being inherited, record current values
        for (const entity of entities) {
          const entityData = getEntityById(entity.entityId) as Record<string, any>

          // For each attribute that will be inherited, record its current value
          for (const attrib of entity.attribs) {
            if (entityData?.attrib && attrib in entityData.attrib) {
              undoEntities.push({
                rowId: entity.rowId,
                id: entityData?.entityId || entityData?.id || entity.entityId,
                type: entity.entityType,
                field: attrib,
                value: (entityData.attrib as Record<string, any>)[attrib],
                isAttrib: true,
                wasInherited: false, // Mark as not inherited
                ownAttrib: entityData?.ownAttrib || [],
                folderId: entityData?.folderId,
                meta: entityData.meta,
              })
            }
          }
        }

        // Create redo entities (to re-inherit)
        const redoEntities: HistoryEntityUpdate[] = entities.flatMap((entity) =>
          entity.attribs.map((attrib) => ({
            rowId: entity.rowId,
            id: entity.entityId,
            type: entity.entityType,
            field: attrib,
            value: null,
            isAttrib: true,
            wasInherited: true, // Mark as inherited
            ownAttrib: entity.ownAttrib,
            folderId: entity.folderId,
            meta: entity.meta,
          })),
        )

        // Push to history if we have changes to record
        if (undoEntities.length > 0) {
          pushHistory(undoEntities, redoEntities)
        }
      }

      const supportedEntityTypes: OperationModel['entityType'][] = ['task', 'folder']
      // Group operations by entity type for bulk processing
      const operations: OperationWithRowId[] = [] // operations sent to the server
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
          rowId: entity.rowId,
          entityType: entityType,
          entityId: entity.entityId,
          type: 'update',
          data: {
            attrib: attribData,
          },
          meta: entity.meta,
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
              // @ts-ignore
              ...(existingOperation.data?.attrib || {}),
              // @ts-ignore
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
        await updateEntities({
          operations,
          patchOperations,
        })
      } catch (error: any) {
        // Extract error code from operation result - check multiple paths
        if (operations.length === 1) {
          error.errorCodes.forEach((errorCode: string) => {
            const op = operations[0]
            const entity = getEntityById(op.entityId as string)
            const entityName = entity?.label || entity?.name || op.entityId || ''
            const message = getErrorMessage(errorCode, op.entityType, entityName)
            toast.error(message)
          })
        } else {
          toast.error('Failed to update entities')
        }

        // Remove the failed update from history stack
        if (pushToHistory && pushHistory && removeHistoryEntries) {
          removeHistoryEntries(1)
        }
      }
    },
    [
      projectName,
      updateEntities,
      getInheritedDependents,
      findInheritedValueFromAncestors,
      pushHistory,
      removeHistoryEntries,
    ],
  )

  return { updateEntities: handleUpdateEntities, inheritFromParent }
}

export default useUpdateTableData
