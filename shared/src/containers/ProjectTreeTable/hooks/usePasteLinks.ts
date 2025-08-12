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
  const { getEntityById, projectName: contextProjectName } = useProjectTableContext()
  const projectName = props?.projectName || contextProjectName

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
        }
        if (linksToAdd.length > 0) {
          updatePromises.push(addMultipleLinks(linksToAdd, addLink))
        }
      }
      try {
        // Execute all link operations in parallel
        await Promise.all(updatePromises)
      } catch (error) {
        throw error
      }
    },
    [projectName, getEntityById, deleteLink, addLink],
  )

  return { pasteTableLinks }
}

export default usePasteLinks
