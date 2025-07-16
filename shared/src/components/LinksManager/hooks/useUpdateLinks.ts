import {
  useCreateEntityLinkMutation,
  useDeleteEntityLinkMutation,
} from '@shared/api/queries/links/updateLinks'
import { useCallback } from 'react'
import { toast } from 'react-toastify'

type Props = {
  projectName: string
  entityId: string
  linkType: string
  direction?: 'in' | 'out'
}

type RemoveLinks = (links: string[]) => Promise<void>
type AddLink = (targetEntityId: string) => Promise<void>

const useUpdateLinks = ({ projectName, direction, entityId, linkType }: Props) => {
  const [deleteLink] = useDeleteEntityLinkMutation()
  const [addLink] = useCreateEntityLinkMutation()

  const removeLinks = useCallback<RemoveLinks>(
    async (links) => {
      try {
        //
        const deletePromises = links.map((linkId) =>
          deleteLink({ linkId, projectName: projectName }),
        )

        const results = await Promise.all(deletePromises)
        const errors = results.filter((result) => 'error' in result)
        if (errors.length > 0) {
          throw errors.map((error) => error || 'Unknown error').join(', ')
        }
        toast.success(`Link${links.length > 1 ? 's' : ''} removed successfully`)
      } catch (error: any) {
        console.error('Error removing links:', error)
        toast.error(`Failed to remove links: ${error}`)
      }
    },
    [deleteLink, projectName],
  )

  const addLinks = useCallback<AddLink>(
    async (targetEntityId) => {
      try {
        const result = await addLink({
          projectName,
          createLinkRequestModel: {
            input: direction === 'out' ? entityId : targetEntityId,
            output: direction === 'in' ? entityId : targetEntityId,
            linkType,
          },
        })

        if ('error' in result) {
          throw result.error || 'Unknown error'
        }

        toast.success('Link added successfully')
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
