import { useCallback } from 'react'
import { toast } from 'react-toastify'
import { useAddProjectTagMutation, useGetCurrentUserQuery } from '@shared/api'
import { getRequestErrorString } from '@shared/util'

/**
 * Saves a tag with a colour to the project anatomy, for the tags dropdowns (onCreateTag).
 * Undefined when the user can't change the project (managers and admins can), or without a project.
 */
export const useCreateProjectTag = (projectName?: string) => {
  const { data: user } = useGetCurrentUserQuery()
  const [addProjectTag] = useAddProjectTagMutation()
  const canEditProject = !!(user?.data?.isAdmin || user?.data?.isManager)

  const createTag = useCallback(
    async (tag: { name: string; color: string }) => {
      if (!projectName) return
      try {
        await addProjectTag({ projectName, tag }).unwrap()
      } catch (error) {
        toast.error(`Could not add the tag to the project: ${getRequestErrorString(error)}`)
      }
    },
    [projectName, addProjectTag],
  )

  return canEditProject && projectName ? createTag : undefined
}
