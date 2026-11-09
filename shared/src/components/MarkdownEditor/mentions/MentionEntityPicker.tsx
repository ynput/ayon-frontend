import { useState } from 'react'
import { toast } from 'react-toastify'
import type { MentionSearchType } from '@shared/api'
import { EntityPickerDialog } from '@shared/containers/EntityPickerDialog/EntityPickerDialog'
import { getRequestErrorString } from '@shared/util'
import type { MentionBrowseProps } from '../types'
import type { ProjectMentionLookup } from './useProjectMentionSearch'

export interface MentionEntityPickerProps extends MentionBrowseProps {
  projectName: string
  lookup: ProjectMentionLookup
}

/** The entity picker of a type, the picked entities become mentions with the folder in the label. */
export const MentionEntityPicker = ({
  projectName,
  type,
  onPick,
  onClose,
  lookup,
}: MentionEntityPickerProps) => {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (ids: string[]) => {
    if (!ids.length) return onClose()
    setIsLoading(true)
    try {
      // in the order they were picked
      onPick(await lookup(type as MentionSearchType, ids))
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
      isLoading={isLoading}
      onSubmit={handleSubmit}
      onClose={onClose}
    />
  )
}
