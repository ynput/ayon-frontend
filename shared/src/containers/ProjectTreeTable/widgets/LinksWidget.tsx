import { Chips, LinkEntity } from '@shared/components'
import { LinksManagerDialog } from '@shared/components/LinksManager/LinksManagerDialog'
import { FC } from 'react'
import { EDIT_TRIGGER_CLASS, WidgetBaseProps } from './CellWidget'
import { createPortal } from 'react-dom'

const isLinkEditable = (direction: 'in' | 'out', linkType: string, entityType: string): boolean => {
  const linkTypeParts = linkType.split('|')
  const [_name, outType, inType] = linkTypeParts
  if (direction === 'in') {
    return entityType === inType
  } else {
    return entityType === outType
  }
}

export type LinkWidgetData = {
  direction: 'in' | 'out'
  entityId: string
  entityType: string
  link: {
    linkType: string
    label: string
    targetEntityType: string
  }
  links: LinkEntity[]
}

export interface LinksWidgetProps extends WidgetBaseProps {
  value: string[]
  valueData?: LinkWidgetData
  projectName: string
  cellRef: React.RefObject<HTMLDivElement>
}

export const LinksWidget: FC<LinksWidgetProps> = ({
  value,
  valueData,
  isEditing,
  cellRef,
  projectName,
  onChange,
  onCancelEdit,
}) => {
  const isEditable = isLinkEditable(
    valueData?.direction || 'out',
    valueData?.link.linkType || '',
    valueData?.entityType || '',
  )

  return (
    <>
      <Chips
        values={value}
        pt={{ chip: { className: EDIT_TRIGGER_CLASS } }}
        disabled={!isEditable}
      />
      {isEditing &&
        valueData &&
        createPortal(
          <LinksManagerDialog
            isEditing={isEditing}
            cellRef={cellRef}
            projectName={projectName}
            linkTypeLabel={valueData.link.label || ''}
            links={valueData.links}
            direction={valueData.direction}
            entityId={valueData.entityId}
            entityType={valueData.entityType}
            targetEntityType={valueData.link.targetEntityType}
            linkType={valueData.link.linkType}
            onClose={onCancelEdit}
            disabled={!isEditable}
          />,
          document.body,
        )}
    </>
  )
}
