import { FC, useRef, useLayoutEffect, useState, useCallback, type CSSProperties } from 'react'
import clsx from 'clsx'
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
  closeOnScroll?: boolean
  onDismissWithoutSave?: () => void
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
  closeOnScroll = true,
  onDismissWithoutSave,
}) => {
  const popupRef = useRef<HTMLDivElement>(null)

  const [position, setPosition] = useState<Position | null>(null)
  const [maxWidth, setMaxWidth] = useState<number | undefined>(undefined)
  const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined)

  const isOpen = isEditing
  const shouldCloseOnOutside = closeOnOutsideClick
  const shouldCloseOnScroll = closeOnScroll

  const updatePosition = useCallback(() => {
    if (!isOpen) return

    const anchorElement = document.getElementById(anchorId)
    const tableContainer = anchorElement?.closest('.table-container') as HTMLElement | null

    if (!anchorElement || !anchorElement.isConnected || !tableContainer) {
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

    const anchorGap = 1
    const spaceBelow = screenHeight - cellRect.bottom - screenPadding
    const spaceAbove = cellRect.top - screenPadding
    let top: number
    let showAbove = false
    let availableHeight: number

    if (spaceBelow < minHeightThreshold && spaceAbove > spaceBelow) {
      showAbove = true
      top = cellRect.top - anchorGap
      availableHeight = spaceAbove - anchorGap
    } else {
      top = cellRect.bottom + anchorGap
      availableHeight = spaceBelow - anchorGap
    }

    // Set max height to prevent dialog from going off screen
    setMaxHeight(Math.min(Math.max(200, availableHeight), maxMaxHeight)) // Minimum 200px height

    setPosition({
      top,
      ...position,
      showAbove,
    })
  }, [anchorId, isOpen])

  useLayoutEffect(() => {
    updatePosition()
  }, [isOpen, updatePosition])

  // watch for when the tableContainer width changes
  useLayoutEffect(() => {
    if (!isOpen) return

    const anchorElement = document.getElementById(anchorId)
    const tableContainer = anchorElement?.closest('.table-container') as HTMLElement | null
    if (!tableContainer) return

    const resizeObserver = new ResizeObserver(() => {
      updatePosition()
    })
    resizeObserver.observe(tableContainer)
    return () => resizeObserver.disconnect()
  }, [anchorId, isOpen, updatePosition])

  // close the dialog when clicking outside of it
  useLayoutEffect(() => {
    if (!shouldCloseOnOutside) return
    if (!isOpen) return

    const abortController = new AbortController()

    const handleClickOutside = (event: MouseEvent) => {
      const anchorElement = document.getElementById(anchorId)
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
        if (onSave) {
          onSave()
          onClose?.()
          return
        }
        if (onDismissWithoutSave) {
          onDismissWithoutSave()
          onClose?.()
          return
        }
        onClose?.()
      }
    }

    document.addEventListener('mousedown', handleClickOutside, { signal: abortController.signal })
    return () => {
      abortController.abort()
    }
  }, [anchorId, isOpen, onClose, onSave, onDismissWithoutSave, shouldCloseOnOutside])

  // close the dialog when the user scrolls the table (or page)
  useLayoutEffect(() => {
    if (!isOpen) return
    const anchorElement = document.getElementById(anchorId)
    const tableContainer = anchorElement?.closest('.table-container') as HTMLElement | null

    const abortController = new AbortController()

    if (shouldCloseOnScroll) {
      const handleScrollToClose = () => {
        if (onDismissWithoutSave) {
          onDismissWithoutSave()
          onClose?.()
        } else {
          onSave?.()
          onClose?.()
        }
      }

      tableContainer?.addEventListener('scroll', handleScrollToClose, {
        passive: true,
        signal: abortController.signal,
      })
    }

    const handleScrollOrResize = (event: Event) => {
      if (
        popupRef.current &&
        (event.type === 'wheel' || event.type === 'touchmove') &&
        popupRef.current.contains(event.target as Node)
      ) {
        return
      }
      updatePosition()
    }

    tableContainer?.addEventListener('scroll', handleScrollOrResize, {
      passive: true,
      signal: abortController.signal,
    })
    window.addEventListener('scroll', handleScrollOrResize, {
      passive: true,
      signal: abortController.signal,
    })
    window.addEventListener('wheel', handleScrollOrResize, {
      passive: true,
      signal: abortController.signal,
    })
    window.addEventListener('touchmove', handleScrollOrResize, {
      passive: true,
      signal: abortController.signal,
    })
    window.addEventListener('resize', handleScrollOrResize, { signal: abortController.signal })

    return () => {
      abortController.abort()
    }
  }, [anchorId, isOpen, onClose, onSave, onDismissWithoutSave, shouldCloseOnScroll, updatePosition])

  if (!isOpen) return null

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
      className={clsx('links-widget-popup', { 'block-shortcuts': isEditing }, className)}
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
