import React from 'react'
import { DetailsDialog } from '@shared/components'

interface DetailsDialogWrapperProps {
  showDetailsDialog: boolean
  firstEntityData: any
  firstProject: string
  entityType: string
  onHide: () => void
}

export const DetailsDialogWrapper: React.FC<DetailsDialogWrapperProps> = ({
  showDetailsDialog,
  firstEntityData,
  firstProject,
  entityType,
  onHide,
}) => {
  if (!showDetailsDialog || !firstEntityData || !firstProject) {
    return null
  }

  return (
    <DetailsDialog
      projectName={firstProject}
      entityType={entityType}
      entityIds={[firstEntityData.id]}
      visible={showDetailsDialog}
      onHide={onHide}
    />
  )
}
