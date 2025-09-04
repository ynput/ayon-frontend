import { toast } from 'react-toastify'

export type LinkToRemove = {
  id: string
  target: { entityId: string; entityType: string }
  source: { entityId: string; entityType: string }
  linkType: string
  direction?: 'in' | 'out'
  projectName: string
}

export type LinkToAdd = {
  targetEntityId: string
  linkId: string
  sourceEntityId: string
  sourceEntityType: string
  targetEntityType: string
  linkType: string
  direction?: 'in' | 'out'
  projectName: string
}

export type DeleteLinkMutation = (params: {
  linkId: string
  projectName: string
  patch?: any
}) => Promise<any>

export type CreateLinkMutation = (params: {
  projectName: string
  createLinkRequestModel: {
    input: string
    output: string
    linkType: string
    id: string
  }
  patch?: any
}) => Promise<any>

/**
 * Remove multiple links across multiple entities
 */
export const removeMultipleLinks = async (
  links: LinkToRemove[],
  deleteLinkMutation: DeleteLinkMutation,
): Promise<void> => {
  if (!links.length) return

  try {
    const deletePromises = links.map((link) =>
      deleteLinkMutation({
        linkId: link.id,
        projectName: link.projectName,
        // @ts-ignore - patch is purely used for patching the entities
        patch: {
          target: link.target,
          source: link.source,
          linkType: link.linkType,
          direction: link.direction,
        },
      }),
    )

    const results = await Promise.all(deletePromises)
    const errors = results.filter((result) => 'error' in result)
    if (errors.length > 0) {
      throw errors.map((error) => error || 'Unknown error').join(', ')
    }
  } catch (error: any) {
    console.error('Error removing links:', error)
    toast.error(`Failed to remove links: ${error}`)
    throw error
  }
}

/**
 * Add multiple links across multiple entities
 */
export const addMultipleLinks = async (
  links: LinkToAdd[],
  createLinkMutation: CreateLinkMutation,
): Promise<void> => {
  if (!links.length) return

  // Check for self-referential links
  const selfReferencingLinks = links.filter((link) => link.sourceEntityId === link.targetEntityId)
  if (selfReferencingLinks.length > 0) {
    toast.error("You can't link an entity to itself")
    return
  }

  try {
    const addPromises = links.map((link) =>
      createLinkMutation({
        projectName: link.projectName,
        createLinkRequestModel: {
          input: link.direction === 'out' ? link.sourceEntityId : link.targetEntityId,
          output: link.direction === 'in' ? link.sourceEntityId : link.targetEntityId,
          linkType: link.linkType,
          id: link.linkId,
        },
        // @ts-ignore - patch is purely used for patching the entities
        patch: {
          direction: link.direction,
          source: {
            entityType: link.sourceEntityType,
            entityId: link.sourceEntityId,
          },
          target: {
            entityId: link.targetEntityId,
            entityType: link.targetEntityType,
          },
        },
      }),
    )

    const results = await Promise.all(addPromises)
    const errors = results.filter((result) => 'error' in result)
    if (errors.length > 0) {
      throw errors.map((error) => error.error || 'Unknown error').join(', ')
    }
  } catch (error: any) {
    console.error('Error adding links:', error)
    toast.error(`Failed to add links: ${error}`)
    throw error
  }
}
