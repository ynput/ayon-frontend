import { CellEditingDialog } from '@shared/components/LinksManager/CellEditingDialog'
import { FC } from 'react'
import { CellValue, WidgetBaseProps } from './CellWidget'
import { type NameWidgetData, RenameForm } from '@shared/components/RenameForm'
import { useProjectDataContext } from '../context'

export interface NameWidgetProps extends WidgetBaseProps {
  value?: CellValue
  valueData?: NameWidgetData
  cellId: string
  entityType: string
}

export const NameWidget: FC<NameWidgetProps> = ({
  value,
  isEditing,
  cellId,
  valueData,
  onCancelEdit,
  entityType,
}) => {
  const { canWriteNamePermission, canWriteLabelPermission } = useProjectDataContext()

  return (
    <>
      {isEditing && value && (
        <CellEditingDialog isEditing={isEditing} anchorId={cellId} onClose={onCancelEdit}>
          <RenameForm
            cellId={cellId}
            initialName={valueData?.name}
            initialLabel={valueData?.label}
            onClose={onCancelEdit}
            entityType={entityType}
            valueData={valueData}
            nameDisabled={
              !canWriteNamePermission
                ? 'You do not have permission to edit the name.'
                : valueData?.hasVersions
                ? 'Cannot edit name when versions exist.'
                : false
            }
            labelDisabled={
              !canWriteLabelPermission ? 'You do not have permission to edit the label.' : false
            }
          />
        </CellEditingDialog>
      )}
    </>
  )
}
