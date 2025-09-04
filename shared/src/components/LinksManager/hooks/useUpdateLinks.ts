import { useCreateEntityLinkMutation, useDeleteEntityLinkMutation } from '@shared/api'
import { useCellEditing } from '@shared/containers'
import { useCallback } from 'react'
import {
  addMultipleLinks,
  removeMultipleLinks,
  LinkToAdd,
  LinkToRemove,
} from '../utils/linkUpdates'
import { toast } from 'react-toastify'

type Props = {
  projectName: string
  entityId: string
  entityType: string
  targetEntityType: string // the entity type of the out links
  linkType: string
  direction?: 'in' | 'out'
}

type RemoveLinks = (
  links: { id: string; target: { entityId: string; entityType: string } }[],
  addToHistory?: boolean,
) => Promise<void>
type AddLinks = (
  links: { targetEntityId: string; linkId: string }[],
  addToHistory?: boolean,
) => Promise<void>

const useUpdateLinks = ({
  projectName,
  direction,
  entityId,
  entityType,
  targetEntityType,
  linkType,
}: Props) => {
  const { history } = useCellEditing()

  const [deleteLink] = useDeleteEntityLinkMutation()
  const [addLink] = useCreateEntityLinkMutation()

  // create new links between this entity and another entity
  const addLinks = useCallback<AddLinks>(
    async (links, addToHistory = true) => {
      try {
        const linksToAdd: LinkToAdd[] = links.map((link) => ({
          targetEntityId: link.targetEntityId,
          linkId: link.linkId,
          sourceEntityId: entityId,
          sourceEntityType: entityType,
          targetEntityType,
          linkType,
          direction,
          projectName,
        }))

        await addMultipleLinks(linksToAdd, addLink)

        // add to history stack
        if (addToHistory && history) {
          history.pushHistory([
            () =>
              removeLinks(
                links.map((link) => ({
                  id: link.linkId,
                  target: { entityId: link.targetEntityId, entityType: targetEntityType },
                })),
                false,
              ),
          ])
        }
      } catch (error: any) {
        // Error handling is done in the utility function
      }
    },
    [addLink, projectName, entityId, entityType, targetEntityType, linkType, direction, history],
  )

  // Internal function to avoid circular dependency
  const removeLinks = useCallback<RemoveLinks>(
    async (
      links: { id: string; target: { entityId: string; entityType: string } }[],
      addToHistory: boolean = true,
    ) => {
      try {
        const linksToRemove: LinkToRemove[] = links.map((link) => ({
          id: link.id,
          target: link.target,
          source: { entityType, entityId },
          linkType,
          direction,
          projectName,
        }))

        await removeMultipleLinks(linksToRemove, deleteLink)

        // add to history stack
        // if there is a history, push it
        if (addToHistory && history) {
          history.pushHistory(
            links.map(
              (link) => () =>
                addLinks([{ targetEntityId: link.target.entityId, linkId: link.id }], false),
            ),
          )
        }
      } catch (error: any) {
        // Error handling is done in the utility function
      }
    },
    [deleteLink, projectName, entityId, entityType, targetEntityType, linkType, direction, history],
  )

  return { remove: removeLinks, add: addLinks }
}

export default useUpdateLinks
