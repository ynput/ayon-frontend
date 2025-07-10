import { useDeleteEntityLinkMutation } from '@shared/api/queries/links/updateLinks'
import { useCallback } from 'react'
import { toast } from 'react-toastify'

type Props = {
  projectName: string
  entityId: string
}

type RemoveLinks = (links: string[]) => Promise<void>

const useUpdateLinks = ({ projectName, entityId }: Props) => {
  const [deleteLink] = useDeleteEntityLinkMutation()

  const removeLinks = useCallback<RemoveLinks>(async (links) => {
    try {
      //
      const deletePromises = links.map((linkId) => deleteLink({ linkId, projectName: projectName }))

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
  }, [])

  return { remove: removeLinks }
}

export default useUpdateLinks
