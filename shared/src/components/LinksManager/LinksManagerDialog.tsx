import { FC, useRef, useLayoutEffect, useState } from 'react'
import styled from 'styled-components'
import { LinksManager, LinksManagerProps } from '.'
import { Container } from './LinksManager.styled'

const StyledPopUp = styled.div<{ $maxHeight?: number }>`
  position: fixed;
  z-index: 300;
  top: 0;
  left: 0;
  overflow: hidden;
`

type Position = {
  top: number
  left: number
  showAbove?: boolean
}

export interface LinksManagerDialogProps extends LinksManagerProps {
  disabled?: boolean
  isEditing: boolean
  cellRef: React.RefObject<HTMLDivElement>
  onClose?: () => void
}

export const LinksManagerDialog: FC<LinksManagerDialogProps> = ({
  disabled,
  isEditing,
  cellRef,
  onClose,
  ...props
}) => {
  const popupRef = useRef<HTMLDivElement>(null)

  const [position, setPosition] = useState<Position | null>(null)

  const updatePosition = () => {
    if (!isEditing || !cellRef.current) {
      return
    }
    const cellRect = cellRef.current.getBoundingClientRect()
    const screenPadding = 16
    const minHeightThreshold = 250
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    let left = cellRect.left
    const estimatedPopupWidth = 300
    if (left + estimatedPopupWidth > screenWidth - screenPadding) {
      left = screenWidth - estimatedPopupWidth - screenPadding
    }
    if (left < screenPadding) {
      left = screenPadding
    }
    const spaceBelow = screenHeight - cellRect.bottom - screenPadding
    const spaceAbove = cellRect.top - screenPadding
    let top: number
    let showAbove = false
    if (spaceBelow < minHeightThreshold && spaceAbove > spaceBelow) {
      showAbove = true
      top = cellRect.top - 4
    } else {
      top = cellRect.bottom + 4
    }
    setPosition({
      top,
      left,
      showAbove,
    })
  }

  useLayoutEffect(() => {
    updatePosition()
  }, [isEditing, cellRef])

  if (!isEditing) return null
  return (
    <StyledPopUp
      ref={popupRef}
      style={{
        top: position?.top,
        left: position?.left,
        ...(position?.showAbove && { transform: 'translateY(-100%)' }),
        visibility: position ? 'visible' : 'hidden',
      }}
      className="links-widget-popup"
    >
      {disabled ? (
        <Container
          style={{ color: 'var(--md-sys-color-outline)' }}
        >{`${props.linkTypeLabel} ${props.direction} link is not of type ${props.entityType}`}</Container>
      ) : (
        <LinksManager {...props} onClose={onClose} />
      )}
    </StyledPopUp>
  )
}
