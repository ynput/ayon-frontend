import { toast } from 'react-toastify'
import { useLazySearchMentionEntitiesQuery, type MentionSearchType } from '@shared/api'
import { EntityPickerDialog } from '@shared/containers/EntityPickerDialog/EntityPickerDialog'
import { getRequestErrorString } from '@shared/util'
import type { MentionBrowseProps } from '../types'
import { getEntityMentionItems, type ProjectMentionSearchOptions } from './useProjectMentionSearch'

export interface MentionEntityPickerProps
  extends MentionBrowseProps,
    Omit<ProjectMentionSearchOptions, 'projectName'> {
  projectName: string
}

/** The entity picker of a type, the picked entities become mentions with the folder in the label. */
export const MentionEntityPicker = ({
  projectName,
  type,
  onPick,
  onClose,
  ...types
}: MentionEntityPickerProps) => {
  const [getEntities, { isFetching }] = useLazySearchMentionEntitiesQuery()

  const handleSubmit = async (ids: string[]) => {
    if (!ids.length) return onClose()
    try {
      const result = await getEntities({
        projectName,
        ids,
        types: [type as MentionSearchType],
        first: ids.length,
      }).unwrap()
      // in the order they were picked
      const items = getEntityMentionItems(result, types).sort(
        (a, b) => ids.indexOf(a.id) - ids.indexOf(b.id),
      )
      onPick(items)
    } catch (error) {
      toast.error(getRequestErrorString(error) || 'Could not mention the picked entities')
      onClose()
    }
  }

  return (
    <EntityPickerDialog
      projectName={projectName}
      entityType={type as MentionSearchType}
      isMultiSelect
      isLoading={isFetching}
      onSubmit={handleSubmit}
      onClose={onClose}
    />
  )
}
