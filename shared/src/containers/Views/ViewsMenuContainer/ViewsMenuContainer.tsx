import { FC, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useViewsContext } from '../context/ViewsContext'
import { getViewsPortalContainer } from '../utils/portalUtils'
import { ViewsMenu } from '../ViewsMenu/ViewsMenu'
import { ViewItem } from '../ViewItem/ViewItem'
import { Icon } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import { useGlobalContext, usePowerpack } from '@shared/context'
import * as Styled from '../Views.styled'
import { VIEWS_DIALOG_CLASS } from '../ViewsDialogContainer/ViewsDialogContainer'
import BaseViewsTagContainer from '@shared/containers/Views/ViewsMenuContainer/BaseViewsTags'

const PowerIcon = styled(Icon)`
  color: var(--md-sys-color-tertiary);
  font-variation-settings: 'FILL' 1, 'wght' 200, 'GRAD' 200, 'opsz' 20;
`

// constants
export const WORKING_VIEW_ID = '_working_' as const
export const NEW_VIEW_ID = '_new_view_' as const

export const ViewsMenuContainer: FC = () => {
  const {
    viewType,
    isMenuOpen,
    setIsMenuOpen,
    setEditingView,
    selectedView,
    workingView,
    viewMenuItems,
  } = useViewsContext()

  const { powerLicense, setPowerpackDialog } = usePowerpack()
  const modalRef = useRef<HTMLDivElement>(null)

  const { user } = useGlobalContext()
  const isAdmin = (user?.uiExposureLevel || 0) >= 900
  // Modal position calculation
  const portalContainer = getViewsPortalContainer(viewType)
  const buttonRect = portalContainer?.getBoundingClientRect()
  const gap = 8
  const modalPosition = {
    top: buttonRect ? buttonRect.bottom + gap : 0,
    left: buttonRect ? buttonRect.left : 0,
  }

  // Close menu when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement

      const clickInsideMenu =
        modalRef.current?.contains(target) || portalContainer?.contains(target)
      const clickInsideEditDialog = document
        .querySelector('.' + VIEWS_DIALOG_CLASS)
        ?.contains(target)
      const clickInsideDropdown = document.querySelector('.options')?.contains(target)
      const clickInsideConfirmDialog = document.querySelector('.p-confirm-dialog')?.contains(target)

      if (
        !clickInsideMenu &&
        !clickInsideEditDialog &&
        !clickInsideDropdown &&
        !clickInsideConfirmDialog &&
        isMenuOpen
      ) {
        setIsMenuOpen(false)
      }
    }

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscapeKey)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [isMenuOpen, portalContainer, setIsMenuOpen])

  // when the view is open, focus the modal
  useEffect(() => {
    if (isMenuOpen && modalRef.current) {
      modalRef.current.focus()
    }
  }, [isMenuOpen])

  const handleCreateView = useCallback(() => {
    if (!powerLicense) {
      setPowerpackDialog('sharedViews')
    } else {
      setEditingView(true)
    }
  }, [powerLicense, setPowerpackDialog, setEditingView, setIsMenuOpen])

  const selectedViewId =
    !selectedView || workingView?.id === selectedView.id
      ? WORKING_VIEW_ID
      : (selectedView.id as string)

  return (
    <>
      {isMenuOpen &&
        createPortal(
          <Styled.ViewsModal style={modalPosition} ref={modalRef} tabIndex={0}>
            <ViewsMenu items={viewMenuItems} selected={selectedViewId} />
            {isAdmin && (
              <>
                <BaseViewsTagContainer />
                <Styled.ViewsMenuDivider />
              </>
            )}
            <ViewItem
              label="Create new view"
              id={NEW_VIEW_ID}
              startContent={<Icon icon="add" />}
              endContent={!powerLicense && <PowerIcon icon="bolt" />}
              onClick={handleCreateView}
              tabIndex={0}
            />
          </Styled.ViewsModal>,
          document.body,
        )}
    </>
  )
}
