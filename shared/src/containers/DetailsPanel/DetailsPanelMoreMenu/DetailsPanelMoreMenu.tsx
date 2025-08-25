import React, { useState } from 'react'
import { Button, Dropdown } from '@ynput/ayon-react-components'
import {
  useDropdownStyling,
  useContextAccess,
  useThumbnailUpload,
  useMenuOptions,
  useMenuActions,
} from './hooks'
import { DetailsDialogWrapper } from './components'

interface DetailsPanelMoreMenuProps {
  entityType: string
  firstEntityData: any
  firstProject: string
  onOpenPip: () => void
  refetch: () => Promise<any>
  entityListsContext?: any
}

export const DetailsPanelMoreMenu: React.FC<DetailsPanelMoreMenuProps> = ({
  entityType,
  firstEntityData,
  firstProject,
  onOpenPip,
  refetch,
  entityListsContext,
}) => {
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedValue, setSelectedValue] = useState<string[]>([])

  const dropdownRef = useDropdownStyling()
  const { onOpenVersionUpload } = useContextAccess()

  const { triggerFileUpload } = useThumbnailUpload({
    entityType,
    firstEntityData,
    firstProject,
    refetch,
  })
  const moreMenuOptions = useMenuOptions({ onOpenVersionUpload, entityListsContext })
  const { handleMoreMenuAction } = useMenuActions({
    entityType,
    firstEntityData,
    firstProject,
    onOpenPip,
    onOpenVersionUpload,
    entityListsContext,
    triggerFileUpload,
    setShowDetailsDialog,
    setSelectedValue,
  })

  const handleDropdownChange = (values: string[]) => {
    if (values.length > 0) {
      handleMoreMenuAction(values[0])
    }
  }

  return (
    <>
      <Dropdown
        ref={dropdownRef}
        options={moreMenuOptions}
        value={selectedValue}
        placeholder=""
        onChange={handleDropdownChange}
        valueTemplate={() => (
          <Button
            icon="more_vert"
            variant="text"
            aria-label="More actions"
            data-tooltip="More actions"
            title="More actions"
          />
        )}
      />

      <DetailsDialogWrapper
        showDetailsDialog={showDetailsDialog}
        firstEntityData={firstEntityData}
        firstProject={firstProject}
        entityType={entityType}
        onHide={() => setShowDetailsDialog(false)}
      />
    </>
  )
}
