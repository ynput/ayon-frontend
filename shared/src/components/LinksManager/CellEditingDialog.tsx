import { FC, useRef, useLayoutEffect, useState, CSSProperties } from 'react'
import { flushSync } from 'react-dom'
import styled from 'styled-components'
import { createPortal } from 'react-dom'

export const BLOCK_DIALOG_CLOSE_CLASS = 'block-dialog-close'

const StyledPopUp = styled.div`
  position: fixed;
  z-index: 310;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  body.column-resizing & {
    opacity: 0 !important;
    pointer-events: none !important;
  }
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
  containerClassName?: string
  onClose?: () => void
  onSave?: () => void
  closeOnOutsideClick?: boolean
  closeOnScroll?: boolean
  onDismissWithoutSave?: () => void
  className?: string
  style?: CSSProperties
  children?: React.ReactNode
}

export const CellEditingDialog: FC<CellEditingDialogProps> = ({
  isEditing,
  anchorId,
  containerClassName = 'table-container',
  onClose,
  onSave,
  closeOnOutsideClick = true,
  closeOnScroll = true,
  onDismissWithoutSave,
  className,
  style,
  children,
}) => {
  const popupRef = useRef<HTMLDivElement>(null)

  const [position, setPosition] = useState<Position | null>(null)
  const [maxWidth, setMaxWidth] = useState<number | undefined>(undefined)
  const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined)

  // get the cell element based on the cellId
  const anchorElement = document.getElementById(anchorId)
  const tableContainer = anchorElement?.closest(`.${containerClassName}`)

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

    let pos: { left?: number; right?: number } = {}
    pos.left = cellRect.left

    setMaxWidth(Math.max(minWidthThreshold, cellRect.width))

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
      ...pos,
      showAbove,
    })
  }

  useLayoutEffect(() => {
    updatePosition()
  }, [isEditing, anchorElement])

  // Hide dialog while a column is being resized (capture phase to bypass stopPropagation)
  useLayoutEffect(() => {
    if (!isEditing || !tableContainer) return

    const handlePointerDown = (e: PointerEvent) => {
      if (!(e.target as HTMLElement).closest('.resize-handle')) return
      document.body.classList.add('column-resizing')

      const handlePointerUp = () => {
        // Wait 2 frames for column widths to settle in the DOM
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            // flushSync forces React to render new dimensions synchronously,
            // so when we remove the CSS class next, the dialog is already correct
            flushSync(() => {
              updatePosition()
            })
            document.body.classList.remove('column-resizing')
          })
        })
        document.removeEventListener('pointerup', handlePointerUp)
      }
      document.addEventListener('pointerup', handlePointerUp)
    }

    tableContainer.addEventListener('pointerdown', handlePointerDown as EventListener, true)
    return () => {
      tableContainer.removeEventListener('pointerdown', handlePointerDown as EventListener, true)
    }
  }, [isEditing, tableContainer])

  // Close the dialog when clicking outside of it
  useLayoutEffect(() => {
    if (!isEditing || !closeOnOutsideClick) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement

      if (
        popupRef.current &&
        !popupRef.current.contains(target) &&
        anchorElement &&
        !anchorElement.contains(target) &&
        // check we are not clicking inside the EntityPickerDialog
        !target.closest('.entity-picker-dialog') &&
        // check we are not clicking on the dialog backdrop
        !target.querySelector('.entity-picker-dialog') &&
        // check we are not clicking inside another dialog
        !target.closest('dialog') &&
        // check we are not clicking inside a dropdown
        !target.closest('.dropdown') &&
        !target.closest('.p-dialog-mask') &&
        !target.closest('.p-datepicker') &&
        !target.closest('.' + BLOCK_DIALOG_CLOSE_CLASS)
      ) {
        // Call onSave before closing (auto-save on click outside)
        if (onSave) {
          onSave()
        } else {
          onClose?.()
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isEditing, closeOnOutsideClick, onClose, onSave, anchorElement])

  // Close dialog on vertical scroll (with 150ms activation delay for virtualized auto-scroll)
  useLayoutEffect(() => {
    if (!isEditing || !closeOnScroll || !tableContainer) return

    let lastScrollTop = (tableContainer as HTMLElement).scrollTop
    let activated = false

    // 150ms delay before activating scroll detection
    const timer = setTimeout(() => {
      activated = true
      lastScrollTop = (tableContainer as HTMLElement).scrollTop
    }, 150)

    const handleScroll = () => {
      if (!activated) return
      const currentScrollTop = (tableContainer as HTMLElement).scrollTop
      // Only close on vertical scroll, ignore horizontal
      if (Math.abs(currentScrollTop - lastScrollTop) > 1) {
        if (onDismissWithoutSave) {
          onDismissWithoutSave()
        } else {
          onClose?.()
        }
      }
    }

    tableContainer.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      clearTimeout(timer)
      tableContainer.removeEventListener('scroll', handleScroll)
    }
  }, [isEditing, closeOnScroll, anchorElement, onClose, onDismissWithoutSave])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // check we are not inside an input or textarea
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return
    }

    // close dialog on escape
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose?.()
    }
  }

  if (!isEditing) return null
  return createPortal(
    <StyledPopUp
      ref={popupRef}
      style={{
        top: position?.top,
        left: position?.left,
        right: position?.right,
        ...(position?.showAbove && { transform: 'translateY(-100%)' }),
        visibility: position ? 'visible' : 'hidden',
        width: maxWidth ? `${maxWidth}px` : 'auto',
        maxHeight: maxHeight ? `${maxHeight}px` : 'none',
        ...style,
      }}
      className={className ? `links-widget-popup ${className}` : 'links-widget-popup'}
      onKeyDown={handleKeyDown}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </StyledPopUp>,
    document.body,
  )
}
