import { FC, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useViewsContext } from '../context/ViewsContext'
import { getViewsPortalContainer } from '../utils/portalUtils'
import * as Styled from '../Views.styled'
import clsx from 'clsx'

export const ViewsButton: FC = () => {
  const { viewType, isMenuOpen, setIsMenuOpen, selectedView } = useViewsContext()

  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleButtonClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsMenuOpen(!isMenuOpen)
  }

  const button = (
    <Styled.ViewsButton
      icon="view_quilt"
      ref={buttonRef}
      onClick={handleButtonClick}
      className={clsx({ active: !!selectedView, open: isMenuOpen })}
    />
  )

  // Try to find the portal container for this viewType
  const portalContainer = getViewsPortalContainer(viewType)

  if (!portalContainer) return null

  // If we have a portal container, render there. Otherwise render normally
  return createPortal(button, portalContainer)
}
