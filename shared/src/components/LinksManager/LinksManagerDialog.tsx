import { FC, useRef, useLayoutEffect, useMemo } from 'react'
import styled from 'styled-components'
import { LinksManager, LinkEntity } from '.'

const StyledPopUp = styled.div<{ $maxHeight?: number }>`
  position: fixed;
  z-index: 300;
  top: 0;
  left: 0;
  max-height: ${({ $maxHeight }) => ($maxHeight ? `${$maxHeight}px` : 'none')};
  overflow: hidden;
`

export interface LinksManagerDialogProps {
  isEditing: boolean
  cellRef: React.RefObject<HTMLDivElement>
  linkTypeLabel: string
  direction?: 'in' | 'out'
  links: LinkEntity[]
  projectName: string
}

export const LinksManagerDialog: FC<LinksManagerDialogProps> = ({
  isEditing,
  cellRef,
  linkTypeLabel,
  direction,
  links,
  projectName,
}) => {
  const popupRef = useRef<HTMLDivElement>(null)

  const initialPosition = useMemo(() => {
    if (!isEditing || !cellRef.current) {
      return { top: 0, left: 0, maxHeight: undefined, showAbove: false }
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
    let maxHeight: number | undefined
    let showAbove = false
    if (spaceBelow < minHeightThreshold && spaceAbove > spaceBelow) {
      showAbove = true
      top = cellRect.top - 4
      maxHeight = spaceAbove - 4
    } else {
      top = cellRect.bottom + 4
      maxHeight = spaceBelow - 4
    }
    return { top, left, maxHeight, showAbove }
  }, [isEditing, cellRef])

  useLayoutEffect(() => {
    if (!isEditing || !cellRef.current || !popupRef.current) return
    const updatePosition = () => {
      if (!cellRef.current || !popupRef.current) return
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
      let maxHeight: number
      let showAbove = false
      if (spaceBelow < minHeightThreshold && spaceAbove > spaceBelow) {
        showAbove = true
        top = cellRect.top - 4
        maxHeight = spaceAbove - 4
      } else {
        top = cellRect.bottom + 4
        maxHeight = spaceBelow - 4
      }
      const popup = popupRef.current
      popup.style.top = `${top}px`
      popup.style.left = `${left}px`
      popup.style.maxHeight = `${maxHeight}px`
      popup.style.transform = showAbove ? 'translateY(-100%)' : 'none'
    }
    updatePosition()
    const handleScrollOrResize = () => {
      requestAnimationFrame(updatePosition)
    }
    window.addEventListener('scroll', handleScrollOrResize, true)
    window.addEventListener('resize', handleScrollOrResize)
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true)
      window.removeEventListener('resize', handleScrollOrResize)
    }
  }, [isEditing, cellRef])

  if (!isEditing) return null
  return (
    <StyledPopUp
      ref={popupRef}
      style={{
        top: initialPosition.top,
        left: initialPosition.left,
        ...(initialPosition.showAbove && { transform: 'translateY(-100%)' }),
      }}
      $maxHeight={initialPosition.maxHeight}
      className="links-widget-popup"
    >
      <LinksManager
        linkTypeLabel={linkTypeLabel}
        links={links}
        direction={direction}
        projectName={projectName}
      />
    </StyledPopUp>
  )
}
