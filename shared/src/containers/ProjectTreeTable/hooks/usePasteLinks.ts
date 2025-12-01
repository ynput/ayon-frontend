import { useCallback } from 'react'
import { useCreateEntityLinkMutation, useDeleteEntityLinkMutation } from '@shared/api'
import {
  addMultipleLinks,
  removeMultipleLinks,
  LinkToAdd,
  LinkToRemove,
} from '@shared/components/LinksManager/utils/linkUpdates'
import { useProjectTableContext } from '../context/ProjectTableContext'
import { getEntityId } from '@shared/util'
import { PasteMethod } from '../context'
import { useCellEditing } from '@shared/containers'
import { toast } from 'react-toastify'
import { useProjectContext } from '@shared/context'

/**
 * Represents a link update operation for table links
 */
export type LinkUpdate = {
  /** Row ID in the table */
  rowId: string
  /** ID of the source entity (the entity that will have links) */
  sourceEntityId: string
  /** Type of the source entity (e.g., 'folder', 'task') */
  sourceEntityType: string
  /** Type of link (e.g., 'workflow', 'dependency') */
  linkType: string
  /** Direction of the link from source entity perspective */
  direction: 'in' | 'out'
  /** Type of the target entities that will be linked */
  targetEntityType: string
  /**
   * Operation type:
   * - 'replace': Remove all existing links of this type and add new ones
   * - 'merge': Keep existing links and add new ones (skip duplicates)
   */
  operation: PasteMethod
  /** Array of target entity IDs to link to */
  targetEntityIds: string[]
}

export type PasteTableLinks = (linkUpdates: LinkUpdate[]) => Promise<void>

interface usePasteLinksProps {
  projectName?: string
}

const usePasteLinks = (props?: usePasteLinksProps) => {
  const { projectName: contextProjectName } = useProjectContext()
  const { getEntityById } = useProjectTableContext()
  const projectName = props?.projectName || contextProjectName
  const { history } = useCellEditing()

  // Add mutation hooks for link operations
  const [deleteLink] = useDeleteEntityLinkMutation()
  const [addLink] = useCreateEntityLinkMutation()

  // Handle link updates using the utility functions
  const pasteTableLinks = useCallback<PasteTableLinks>(
    async (linkUpdates: LinkUpdate[]) => {
      if (!projectName || !linkUpdates.length) return

      // Group operations by entity and link type for processing
      const operationsToProcess = new Map<string, LinkUpdate[]>()

      for (const update of linkUpdates) {
        const key = `${update.sourceEntityId}-${update.linkType}-${update.direction}`
        if (!operationsToProcess.has(key)) {
          operationsToProcess.set(key, [])
        }
        operationsToProcess.get(key)!.push(update)
      }

      const updatePromises: Promise<void>[] = []
      // Collect all adds/removes across all operations to build a single history entry
      const addedInPaste: LinkToAdd[] = []
      const removedInPaste: LinkToRemove[] = []

      // Pre-flight validation: detect any self-referential links across the whole paste
      for (const [, updates] of operationsToProcess) {
        const { sourceEntityId } = updates[0]
        const targets = new Set<string>()
        updates.forEach((u) => u.targetEntityIds.forEach((id) => targets.add(id)))
        if (targets.has(sourceEntityId)) {
          toast.error("You can't link an entity to itself")
          return
        }
      }
      // Process each unique entity-linkType-direction combination
      for (const [key, updates] of operationsToProcess) {
        const firstUpdate = updates[0]
        const {
          sourceEntityId,
          sourceEntityType,
          linkType,
          direction,
          targetEntityType,
          operation,
        } = firstUpdate

        // Collect all target entity IDs from all updates for this combination
        const allTargetEntityIds = new Set<string>()
        updates.forEach((update) => {
          update.targetEntityIds.forEach((id) => allTargetEntityIds.add(id))
        })

        const linksToAdd: LinkToAdd[] = []
        const linksToRemove: LinkToRemove[] = []

        // Get current links for this entity and link type
        const entityData = getEntityById(sourceEntityId)
        if (!entityData) {
          console.warn(`Entity not found: ${sourceEntityId}`)
          continue
        }

        // Get current links for this link type and direction
        const currentLinks = entityData.links

        if (operation === 'replace') {
          // Remove all current links of this (linkType + direction + targetEntityType) only.
          if (Array.isArray(currentLinks)) {
            for (const link of currentLinks) {
              if (
                link.entityType === targetEntityType &&
                link.direction === direction &&
                link.linkType === linkType.split('|')[0]
              ) {
                linksToRemove.push({
                  id: link.id,
                  target: {
                    entityId: link.node.id,
                    entityType: link.entityType,
                  },
                  source: { entityId: sourceEntityId, entityType: sourceEntityType },
                  linkType,
                  direction,
                  projectName,
                })
              }
            }
          }

          // Add all new links
          for (const targetEntityId of allTargetEntityIds) {
            const linkId = getEntityId()

            linksToAdd.push({
              targetEntityId,
              linkId,
              sourceEntityId,
              sourceEntityType,
              targetEntityType,
              linkType,
              direction,
              projectName,
            })
          }
        } else if (operation === 'merge') {
          // Get existing target entity IDs for this (linkType + direction + targetEntityType)
          const existingTargetIds = new Set<string>()
          if (Array.isArray(currentLinks)) {
            currentLinks.forEach((link) => {
              if (
                link.entityType === targetEntityType &&
                link.direction === direction &&
                link.linkType === linkType
              ) {
                existingTargetIds.add(link.node.id)
              }
            })
          }

          console.log(existingTargetIds)

          // Only add links that don't already exist
          for (const targetEntityId of allTargetEntityIds) {
            if (!existingTargetIds.has(targetEntityId)) {
              const linkId = getEntityId()

              linksToAdd.push({
                targetEntityId,
                linkId,
                sourceEntityId,
                sourceEntityType,
                targetEntityType,
                linkType,
                direction,
                projectName,
              })
            }
          }
        }

        if (linksToRemove.length > 0) {
          updatePromises.push(removeMultipleLinks(linksToRemove, deleteLink))
          removedInPaste.push(...linksToRemove)
        }
        if (linksToAdd.length > 0) {
          updatePromises.push(addMultipleLinks(linksToAdd, addLink))
          addedInPaste.push(...linksToAdd)
        }
      }
      try {
        // Execute all link operations in parallel
        await Promise.all(updatePromises)

        // Push a single history entry that undoes BOTH: remove added links and re-add removed links
        if (history && (addedInPaste.length > 0 || removedInPaste.length > 0)) {
          // Prepare inverse operations for undo
          const addedToRemove: LinkToRemove[] = addedInPaste.map((link) => ({
            id: link.linkId,
            projectName: link.projectName,
            linkType: link.linkType,
            direction: link.direction,
            target: { entityId: link.targetEntityId, entityType: link.targetEntityType },
            source: { entityId: link.sourceEntityId, entityType: link.sourceEntityType },
          }))

          const removedToAdd: LinkToAdd[] = removedInPaste.map((link) => ({
            targetEntityId: link.target.entityId,
            linkId: link.id,
            sourceEntityId: link.source.entityId,
            sourceEntityType: link.source.entityType,
            targetEntityType: link.target.entityType,
            linkType: link.linkType,
            direction: link.direction,
            projectName: link.projectName,
          }))

          // Single callbacks to keep history atomic
          const undoCallback = () => {
            const tasks: Promise<void>[] = []
            if (addedToRemove.length) tasks.push(removeMultipleLinks(addedToRemove, deleteLink))
            if (removedToAdd.length) tasks.push(addMultipleLinks(removedToAdd, addLink))
            if (tasks.length) Promise.all(tasks).catch(() => {})
          }

          const redoCallback = () => {
            const tasks: Promise<void>[] = []
            if (removedInPaste.length) tasks.push(removeMultipleLinks(removedInPaste, deleteLink))
            if (addedInPaste.length) tasks.push(addMultipleLinks(addedInPaste, addLink))
            if (tasks.length) Promise.all(tasks).catch(() => {})
          }

          history.pushHistory([undoCallback], [redoCallback])
        }
      } catch (error) {
        throw error
      }
    },
    [projectName, getEntityById, deleteLink, addLink, history],
  )

  return { pasteTableLinks }
}

export default usePasteLinks
