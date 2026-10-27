import { useCallback, useMemo } from 'react'
import { toast } from 'react-toastify'
import { useGetCurrentUserQuery, useSaveProjectTagsMutation } from '@shared/api'
import type { Tag } from '@shared/api/generated'
import { getRequestErrorString } from '@shared/util'

// the tooltip of the colour button of a tags dropdown
export const projectTagColorLabel = (tag: { color?: string }) =>
  tag.color ? 'Change the colour in the project tags' : 'Add to the project tags with a colour'

// Saves of one project's tags run one after another: each reads the project's tags and saves the
// whole list, so a colour picked for a new tag and the tag being added at the same time would
// otherwise overwrite each other.
const saveQueues = new Map<string, Promise<unknown>>()

/**
 * Edits the project anatomy's tags from a tags dropdown: new tags saved on entities are added to
 * it, and picked colours are saved. Undefined when the user can't change the project (managers
 * and admins can), or without a project.
 */
export const useEditProjectTags = (
  projectName: string | undefined,
  // the tags already in the anatomy, so tags only go there once
  anatomyTags: { name: string }[] = [],
) => {
  const { data: user } = useGetCurrentUserQuery(undefined, { skip: !projectName })
  const [saveProjectTags] = useSaveProjectTagsMutation()
  const canEdit = !!projectName && !!(user?.data?.isAdmin || user?.data?.isManager)

  const save = useCallback(
    (tags: Tag[]) => {
      if (!projectName || !tags.length) return
      const queued = (saveQueues.get(projectName) || Promise.resolve()).then(async () => {
        try {
          await saveProjectTags({ projectName, tags }).unwrap()
        } catch (error) {
          toast.error(`Could not save the tags to the project: ${getRequestErrorString(error)}`)
        }
      })
      saveQueues.set(projectName, queued)
    },
    [projectName, saveProjectTags],
  )

  return useMemo(() => {
    if (!canEdit) return undefined
    const known = new Set(anatomyTags.map((tag) => tag.name))
    return {
      // a picked colour, for a tag in the anatomy or one added to it
      setTagColor: (tag: { name: string; color: string }) => save([tag]),
      // tags added to entities go to the anatomy too, with its default colour
      addTags: (names: string[]) =>
        save(names.filter((name) => name && !known.has(name)).map((name) => ({ name }))),
    }
  }, [canEdit, anatomyTags, save])
}
