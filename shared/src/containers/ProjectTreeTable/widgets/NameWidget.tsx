import { CellEditingDialog } from '@shared/components/LinksManager/CellEditingDialog'
import { FC } from 'react'
import { CellValue, WidgetBaseProps } from './CellWidget'
import RenameForm, { NameData } from '../../../../../src/components/RenameForm'
import { useProjectDataContext } from '../context'

export interface NameWidgetProps extends WidgetBaseProps {
  value?: CellValue
  valueData?: NameData
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
  const { canEditName, canEditLabel } = useProjectDataContext()

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
            canEditName={canEditName}
            canEditLabel={canEditLabel}
          />
        </CellEditingDialog>
      )}
    </>
  )
}
