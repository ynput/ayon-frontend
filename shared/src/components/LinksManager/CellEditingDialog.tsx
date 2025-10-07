import { FC, useRef, useLayoutEffect, useState, type CSSProperties } from 'react'
import styled from 'styled-components'
import { createPortal } from 'react-dom'

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

export interface CellEditingDialogProps {
  isEditing: boolean
  anchorId: string
  onClose?: () => void
  onSave?: () => void
  children?: React.ReactNode
  className?: string
  style?: CSSProperties
  closeOnOutsideClick?: boolean
}

export const CellEditingDialog: FC<CellEditingDialogProps> = ({
  isEditing,
  anchorId,
  onClose,
  onSave,
  children,
  className,
  style,
  closeOnOutsideClick,
}) => {
  const popupRef = useRef<HTMLDivElement>(null)

  const [position, setPosition] = useState<Position | null>(null)
  const [maxWidth, setMaxWidth] = useState<number | undefined>(undefined)
  const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined)

  const isOpen = isEditing
  const shouldCloseOnOutside = closeOnOutsideClick

  // get the cell element based on the cellId
  const anchorElement = document.getElementById(anchorId)
  const tableContainer = anchorElement?.closest('.table-container')

  const updatePosition = () => {
    if (!isOpen) return

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
  }, [isOpen, anchorElement])

  // watch for when the tableContainer width changes
  useLayoutEffect(() => {
    if (!tableContainer || !isOpen) return

    const resizeObserver = new ResizeObserver(() => {
      updatePosition()
    })
    resizeObserver.observe(tableContainer)
    return () => resizeObserver.disconnect()
  }, [tableContainer, anchorElement, isOpen])

  // close the dialog when clicking outside of it
  useLayoutEffect(() => {
    if (!shouldCloseOnOutside) return
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        anchorElement &&
        !anchorElement.contains(event.target as Node) &&
        // check we are not clicking inside the EntityPickerDialog
        !(event.target as HTMLElement).closest('.entity-picker-dialog') &&
        // check we are not clicking on the dialog backdrop
        !(event.target as HTMLElement).querySelector('.entity-picker-dialog')
      ) {
        onSave?.()
        onClose?.()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose, onSave, anchorElement, shouldCloseOnOutside, isOpen])

  if (!isOpen) return null

  const combinedClassName = ['links-widget-popup', className].filter(Boolean).join(' ')

  const popUp = (
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
        ...style,
      }}
      className={combinedClassName}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onClose?.()
        }
      }}
      onMouseDown={(e) => {
        e.stopPropagation()
      }}
      onClick={(e) => {
        e.stopPropagation()
      }}
    >
      {children}
    </StyledPopUp>
  )

  return createPortal(popUp, document.body)
}
