import { CellEditingDialog } from '@shared/components/LinksManager/CellEditingDialog'
import { FC } from 'react'
import { CellValue, NameData, WidgetBaseProps } from './CellWidget'
import { useDetailsPanelEntityContext } from '../context/DetailsPanelEntityContext'
import { useSelectedRowsContext } from '../context/SelectedRowsContext'
import RenameForm from '@shared/containers/ProjectTreeTable/widgets/RenameForm'

export interface NameWidgetProps extends WidgetBaseProps {
  value?: CellValue
  valueData?: NameData
  projectName: string
  cellId: string
  rowId: string
  entityType: string
}

export const NameWidget: FC<NameWidgetProps> = ({
  value,
  isEditing,
  cellId,
  valueData,
  onCancelEdit,
  rowId,
  entityType,
}) => {
  return (
    <>
      {isEditing && value && (
        <CellEditingDialog isEditing={isEditing} anchorId={cellId} onClose={onCancelEdit}>
          <RenameForm
            cellId={cellId}
            rowId={rowId}
            initialName={valueData?.name}
            initialLabel={valueData?.label}
            onClose={onCancelEdit}
            entityType={entityType}
          />
        </CellEditingDialog>
      )}
    </>
  )
}
