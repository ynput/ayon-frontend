import { FC, useRef, useLayoutEffect, useState } from 'react'
import styled from 'styled-components'
import { LinksManager, LinksManagerProps } from '.'
import { Container } from './LinksManager.styled'

const StyledPopUp = styled.div`
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
  anchorId: string
  onClose?: () => void
}

export const LinksManagerDialog: FC<LinksManagerDialogProps> = ({
  disabled,
  isEditing,
  anchorId,
  onClose,
  ...props
}) => {
  const popupRef = useRef<HTMLDivElement>(null)

  const [position, setPosition] = useState<Position | null>(null)
  const [maxWidth, setMaxWidth] = useState<number | undefined>(undefined)

  const updatePosition = () => {
    if (!isEditing) return

    // get the cell element based on the cellId
    const anchorElement = document.getElementById(anchorId)
    if (!anchorElement) {
      // if the anchor element is not found, position in the center of the screen
      setPosition({
        top: window.innerHeight / 2,
        left: window.innerWidth / 2,
        showAbove: false,
      })
      setMaxWidth(undefined)
      return
    }

    const cellRect = anchorElement.getBoundingClientRect()
    const screenPadding = 16
    const minHeightThreshold = 250
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    let left = cellRect.left

    // Calculate max width based on left position and screen padding
    const availableWidth = screenWidth - left - screenPadding
    setMaxWidth(availableWidth)

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
  }, [isEditing, anchorId])

  if (!isEditing) return null
  return (
    <StyledPopUp
      ref={popupRef}
      style={{
        top: position?.top,
        left: position?.left,
        ...(position?.showAbove && { transform: 'translateY(-100%)' }),
        visibility: position ? 'visible' : 'hidden',
        maxWidth: maxWidth ? `${maxWidth}px` : 'none',
      }}
      className="links-widget-popup"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onClose?.()
        }
      }}
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
