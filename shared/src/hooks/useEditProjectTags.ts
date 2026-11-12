import { useCallback, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { useGetCurrentUserQuery, useSaveProjectTagsMutation } from '@shared/api'
import type { Tag } from '@shared/api/generated'
import type { EnumItemDialogProps, EnumItemDraft } from '@shared/components/EnumItemDialog'
import { getRequestErrorString } from '@shared/util'

// Saves of one project's tags run one after another: each reads the project's tags and saves the
// whole list, so a tag created with a colour and the same tag being added to entities at the same
// time would otherwise overwrite each other.
const saveQueues = new Map<string, Promise<unknown>>()

/**
 * Edits the project anatomy's tags from a tags dropdown: new tags saved on entities are added to
 * it, and a dialog (render `dialog` with EnumItemDialog) creates a tag with a colour or changes a
 * tag's colour. Undefined when the user can't change the project (managers and admins can), or
 * without a project.
 */
export const useEditProjectTags = (
  projectName: string | undefined,
  // the tags already in the anatomy, so tags only go there once
  anatomyTags: { name: string }[] = [],
) => {
  const { data: user } = useGetCurrentUserQuery(undefined, { skip: !projectName })
  const [saveProjectTags] = useSaveProjectTagsMutation()
  const canEdit = !!projectName && !!(user?.data?.isAdmin || user?.data?.isManager)

  // the tag in the dialog, and the dropdown waiting for it
  const [editing, setEditing] = useState<{
    item: EnumItemDraft
    isNew: boolean
    resolve: (name?: string) => void
  } | null>(null)

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

    const close = (name?: string) => {
      editing?.resolve(name)
      setEditing(null)
    }

    const dialog: EnumItemDialogProps = {
      item: editing?.item,
      isNew: editing?.isNew,
      fields: ['color'],
      itemLabel: 'tag',
      onSave: ({ value, color }) => {
        // a tag created without a colour gets the anatomy's default one
        save([{ name: value, color: color || undefined }])
        close(value)
      },
      onCancel: () => close(),
    }

    return {
      // the dropdown's edit button and "add new" option open the dialog, and select a new tag
      onEditOption: (tag: { name?: string; color?: string }, isNew: boolean) =>
        new Promise<string | undefined>((resolve) =>
          setEditing({ item: { value: tag.name || '', color: tag.color || '' }, isNew, resolve }),
        ),
      dialog,
      // tags added to entities go to the anatomy too, with its default colour
      addTags: (names: string[]) =>
        save(names.filter((name) => name && !known.has(name)).map((name) => ({ name }))),
    }
  }, [canEdit, anatomyTags, save, editing])
}
