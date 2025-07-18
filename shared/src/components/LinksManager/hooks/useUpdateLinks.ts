import { useCreateEntityLinkMutation, useDeleteEntityLinkMutation } from '@shared/api'
import { useCellEditing } from '@shared/containers'
import { useCallback } from 'react'
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
type AddLink = (targetEntityId: string, linkId: string, addToHistory?: boolean) => Promise<void>

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

  const removeLinks = useCallback<RemoveLinks>(
    async (links, addToHistory = true) => {
      try {
        //
        const deletePromises = links.map((link) =>
          deleteLink({
            linkId: link.id,
            projectName: projectName,
            // @ts-ignore - patch is purely used for patching the entities
            patch: {
              target: link.target,
              source: { entityType, entityId },
              linkType,
              direction,
            },
          }),
        )

        const results = await Promise.all(deletePromises)
        const errors = results.filter((result) => 'error' in result)
        if (errors.length > 0) {
          throw errors.map((error) => error || 'Unknown error').join(', ')
        }
        toast.success(`Link${links.length > 1 ? 's' : ''} removed successfully`)

        // add to history stack
        // if there is a history, push it
        if (addToHistory && history) {
          history.pushHistory(
            links.map((link) => () => addLinks(link.target.entityId, link.id, false)),
          )
        }
      } catch (error: any) {
        console.error('Error removing links:', error)
        toast.error(`Failed to remove links: ${error}`)
      }
    },
    [deleteLink, projectName],
  )

  const addLinks = useCallback<AddLink>(
    async (targetEntityId, linkId, addToHistory = true) => {
      try {
        const result = await addLink({
          projectName,
          createLinkRequestModel: {
            input: direction === 'out' ? entityId : targetEntityId,
            output: direction === 'in' ? entityId : targetEntityId,
            linkType,
            id: linkId,
          },
          // @ts-ignore - patch is purely used for patching the entities
          patch: {
            direction,
            source: {
              entityType,
              entityId,
            },
            target: {
              entityId: targetEntityId,
              entityType: targetEntityType,
            },
          },
        })

        if ('error' in result) {
          throw result.error || 'Unknown error'
        }

        toast.success('Link added successfully')

        // add to history stack
        if (addToHistory && history) {
          history.pushHistory([
            () =>
              removeLinks(
                [
                  {
                    id: linkId,
                    target: { entityId: targetEntityId, entityType: targetEntityType },
                  },
                ],
                false,
              ),
          ])
        }
      } catch (error: any) {
        console.error('Error adding link:', error)
        toast.error(`Failed to add link: ${error}`)
      }
    },
    [addLink, projectName, entityId],
  )

  return { remove: removeLinks, add: addLinks }
}

export default useUpdateLinks
