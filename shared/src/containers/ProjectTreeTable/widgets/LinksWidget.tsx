import { Chips, LinkEntity } from '@shared/components'
import { LinksManagerDialog } from '@shared/components/LinksManager/LinksManagerDialog'
import { FC } from 'react'
import { EDIT_TRIGGER_CLASS, WidgetBaseProps } from './CellWidget'
import { createPortal } from 'react-dom'
import styled from 'styled-components'

const StyledPopUp = styled.div<{ $maxHeight?: number }>`
  position: fixed;
  z-index: 300;
  top: 0;
  left: 0;
  max-height: ${({ $maxHeight }) => ($maxHeight ? `${$maxHeight}px` : 'none')};
  overflow: hidden;
`

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
  return (
    <>
      <Chips values={value} pt={{ chip: { className: EDIT_TRIGGER_CLASS } }} />
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
          />,
          document.body,
        )}
    </>
  )
}
