import { useCallback } from 'react'
import { toast } from 'react-toastify'
import { useGetCurrentUserQuery, useSetProjectTagColorMutation } from '@shared/api'
import { getRequestErrorString } from '@shared/util'

// the tooltip of the colour button of a tags dropdown
export const projectTagColorLabel = (tag: { color?: string }) =>
  tag.color ? 'Change the colour in the project tags' : 'Add to the project tags with a colour'

/**
 * Saves a tag's colour to the project anatomy, adding the tag when it isn't there, for the tags
 * dropdowns (onTagColorChange). Undefined when the user can't change the project (managers and
 * admins can), or without a project.
 */
export const useProjectTagColor = (projectName?: string) => {
  const { data: user } = useGetCurrentUserQuery()
  const [setProjectTagColor] = useSetProjectTagColorMutation()
  const canEditProject = !!(user?.data?.isAdmin || user?.data?.isManager)

  const setTagColor = useCallback(
    async (tag: { name: string; color: string }) => {
      if (!projectName) return
      try {
        await setProjectTagColor({ projectName, tag }).unwrap()
      } catch (error) {
        toast.error(`Could not save the tag to the project: ${getRequestErrorString(error)}`)
      }
    },
    [projectName, setProjectTagColor],
  )

  return canEditProject && projectName ? setTagColor : undefined
}
