import { FC, useRef, useLayoutEffect, useState } from 'react'
import styled from 'styled-components'
import { LinksManager, LinksManagerProps } from '.'
import { Container } from './LinksManager.styled'

const StyledPopUp = styled.div`
  position: fixed;
  z-index: 310;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`

type Position = {
  top: number
  left?: number
  right?: number
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
  const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined)

  // get the cell element based on the cellId
  const anchorElement = document.getElementById(anchorId)
  const tableContainer = anchorElement?.closest('.table-container')

  const updatePosition = () => {
    if (!isEditing) return

    if (!anchorElement || !tableContainer) {
      // if the anchor element is not found, position in the center of the screen
      setPosition({
        top: window.innerHeight / 2,
        left: window.innerWidth / 2,
        showAbove: false,
      })
      setMaxWidth(undefined)
      setMaxHeight(undefined)
      return
    }

    const cellRect = anchorElement.getBoundingClientRect()

    const containerRect = tableContainer.getBoundingClientRect()
    const containerRight = containerRect.right
    const containerToRightOfScreen = window.innerWidth - containerRect.right

    const screenPadding = 24
    const minHeightThreshold = 250
    const minWidthThreshold = 400
    const maxMaxHeight = 600
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight

    // Check if we have enough space to the right of the cell
    const spaceToRight = containerRight - cellRect.left
    let position: { left?: number; right?: number } = {}
    let dialogWidth = minWidthThreshold

    if (spaceToRight < minWidthThreshold) {
      // Not enough space to the right, anchor to the right side of the cell
      const spaceToLeft = cellRect.right - screenPadding
      if (spaceToLeft >= minWidthThreshold) {
        // Anchor to the right side of the cell
        position.right = Math.max(
          screenWidth - cellRect.right,
          screenPadding + containerToRightOfScreen,
        )
      } else {
        // Not enough space on either side, center and use available width
        position.left = screenPadding
        dialogWidth = screenWidth - 2 * screenPadding
      }
    } else {
      // Enough space to the right, position normally
      position.left = cellRect.left
      dialogWidth = Math.max(minWidthThreshold, spaceToRight)
    }

    setMaxWidth(dialogWidth)

    const spaceBelow = screenHeight - cellRect.bottom - screenPadding
    const spaceAbove = cellRect.top - screenPadding
    let top: number
    let showAbove = false
    let availableHeight: number

    if (spaceBelow < minHeightThreshold && spaceAbove > spaceBelow) {
      showAbove = true
      top = cellRect.top - 4
      availableHeight = spaceAbove - 4
    } else {
      top = cellRect.bottom + 4
      availableHeight = spaceBelow - 4
    }

    // Set max height to prevent dialog from going off screen
    setMaxHeight(Math.min(Math.max(200, availableHeight), maxMaxHeight)) // Minimum 200px height

    setPosition({
      top,
      ...position,
      showAbove,
    })
  }

  useLayoutEffect(() => {
    updatePosition()
  }, [isEditing, anchorElement])

  // watch for when the tableContainer width changes
  useLayoutEffect(() => {
    if (tableContainer) {
      const resizeObserver = new ResizeObserver(() => {
        updatePosition()
      })
      resizeObserver.observe(tableContainer)
      return () => resizeObserver.disconnect()
    }
  }, [tableContainer, anchorElement])

  if (!isEditing) return null
  return (
    <StyledPopUp
      ref={popupRef}
      style={{
        top: position?.top,
        left: position?.left,
        right: position?.right,
        ...(position?.showAbove && { transform: 'translateY(-100%)' }),
        visibility: position ? 'visible' : 'hidden',
        maxWidth: maxWidth ? `${maxWidth}px` : 'none',
        maxHeight: maxHeight ? `${maxHeight}px` : 'none',
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
