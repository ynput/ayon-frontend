import { Chips, LinksManager } from '@shared/components'
import { FC, MouseEvent } from 'react'
import { EDIT_TRIGGER_CLASS, WidgetBaseProps } from './CellWidget'
import { createPortal } from 'react-dom'
import styled from 'styled-components'

const StyledPopUp = styled.div`
  position: fixed;
  z-index: 300;
  top: 0;
  left: 0;
`

export interface LinksWidgetProps extends WidgetBaseProps {
  value: string[]
  cellRef: React.RefObject<HTMLDivElement>
}

export const LinksWidget: FC<LinksWidgetProps> = ({
  value,
  isEditing,
  cellRef,
  onChange,
  onCancelEdit,
}) => {
  return (
    <>
      <Chips values={value} pt={{ chip: { className: EDIT_TRIGGER_CLASS } }} />
      {isEditing &&
        createPortal(
          <StyledPopUp
            style={{
              top: (cellRef.current?.getBoundingClientRect().bottom ?? 0) + 8,
              left: cellRef.current?.getBoundingClientRect().left ?? 0,
            }}
            className="links-widget-popup"
          >
            <LinksManager />
          </StyledPopUp>,
          document.body,
        )}
    </>
  )
}
