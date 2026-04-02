import { FC, KeyboardEvent, useRef } from 'react'
import { createPortal } from 'react-dom'
import { SelectedViewState, useViewsContext } from '../context/ViewsContext'
import { getViewsPortalContainer } from '../utils/portalUtils'
import * as Styled from '../Views.styled'
import clsx from 'clsx'
import { Button, ButtonProps } from '@ynput/ayon-react-components'

type Props = {
  fullButton?: boolean
  fullButtonProps?: (selectedView: SelectedViewState) => Partial<ButtonProps>
}

export const ViewsButton: FC<Props> = ({ fullButton = false, fullButtonProps = () => ({}) }: Props) => {
  const { viewType, viewAlias, isMenuOpen, setIsMenuOpen, selectedView, isViewWorking, editingViewId } =
    useViewsContext()

  const buttonRef = useRef<HTMLButtonElement>(null)

  // views not support for this page
  if (!viewType) return null

  const handleButtonClick = (
    e: React.MouseEvent<HTMLSpanElement> | React.KeyboardEvent<HTMLSpanElement>,
  ) => {
    e.preventDefault()
    e.stopPropagation()
    setIsMenuOpen(!isMenuOpen)
  }

  const buttonProps = {
    icon: "view_quilt",
    onClick: handleButtonClick,
    className: clsx({ active: !!editingViewId, open: isMenuOpen }),
    tabIndex: 0,
    "data-tooltip": isViewWorking ? `Working ${viewAlias.toLowerCase()}` : `${viewAlias}: ` + selectedView?.label || 'None',
    "data-tooltip-delay": 0,
    onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        handleButtonClick(e)
      }
    },
  }

  const button = fullButton
    ? <Button {...({ ...buttonProps, ...fullButtonProps(selectedView) })} />
    : (
      <Styled.ViewsButton
        ref={buttonRef}
        {...buttonProps}
      />
    )

  // Try to find the portal container for this viewType
  const portalContainer = getViewsPortalContainer(viewType)

  if (!portalContainer) return null

  // If we have a portal container, render there. Otherwise render normally
  return createPortal(button, portalContainer)
}
