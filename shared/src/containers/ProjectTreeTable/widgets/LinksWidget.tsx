import { Chips, ChipValue, LinkEntity } from '@shared/components'
import { LinksManagerDialog } from '@shared/components/LinksManager/LinksManagerDialog'
import { FC } from 'react'
import { EDIT_TRIGGER_CLASS, WidgetBaseProps } from './CellWidget'
import { createPortal } from 'react-dom'

export const isLinkEditable = (
  direction: 'in' | 'out',
  linkType: string,
  entityType: string,
): boolean => {
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
  value?: LinkWidgetData
  projectName: string
  cellId: string
  disabled?: boolean
}

export const LinksWidget: FC<LinksWidgetProps> = ({
  value,
  isEditing,
  cellId,
  projectName,
  disabled,
  onChange: _onChange, // not used in this widget
  onCancelEdit,
}) => {
  return (
    <>
      <Chips
        values={
          value?.links?.map((v) => ({ label: v.label, tooltip: v.parents.join('/') + v.label })) ||
          []
        }
        pt={{ chip: { className: EDIT_TRIGGER_CLASS } }}
        disabled={disabled}
      />
      {isEditing &&
        value &&
        createPortal(
          <LinksManagerDialog
            isEditing={isEditing}
            anchorId={cellId}
            projectName={projectName}
            linkTypeLabel={value.link.label || ''}
            links={value.links}
            direction={value.direction}
            entityId={value.entityId}
            entityType={value.entityType}
            targetEntityType={value.link.targetEntityType}
            linkType={value.link.linkType}
            onClose={onCancelEdit}
            disabled={disabled}
          />,
          document.body,
        )}
    </>
  )
}
