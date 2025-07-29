import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as Styled from './Views.styled'
import type { ViewMenuItem } from './ViewsMenu'
import { VIEW_DIVIDER, ViewsMenu } from './ViewsMenu'
import clsx from 'clsx'
import { createPortal } from 'react-dom'
import { ViewItem } from './ViewItem/ViewItem'
import { Icon } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import { usePowerpack } from '@shared/context'

const PowerIcon = styled(Icon)`
  color: var(--md-sys-color-tertiary);
  font-variation-settings: 'FILL' 1, 'wght' 200, 'GRAD' 200, 'opsz' 20;
`

const personalBaseView: ViewItem = {
  id: 'personal',
  label: 'Personal',
  startContent: <Icon icon="person" />,
  isEditable: false,
  isPersonal: true,
}

const dummyViews: ViewItem[] = [
  {
    id: 'view1',
    label: 'View 1',
    isEditable: true,
  },
  {
    id: 'view2',
    label: 'View 2',
    isEditable: true,
  },
  {
    id: 'view3',
    label: 'View 3',
    isEditable: false,
  },
]

export type SelectedViewState = string | null // id of view otherwise null with use personal
export const NEW_VIEW_ID = '_new_view_' as const // id for creating a new view
export type EditingViewState = string | typeof NEW_VIEW_ID | null // id of view being edited otherwise null

export interface ViewsProps {
  viewType: 'overview'
  projectName?: string
}

export const Views: FC<ViewsProps> = ({ viewType, projectName }) => {
  // context
  const { powerLicense, setPowerpackDialog } = usePowerpack()

  // REFS
  const buttonRef = useRef<HTMLButtonElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const buttonRect = buttonRef.current?.getBoundingClientRect()

  const gap = 4
  const modalPosition = {
    top: buttonRect ? buttonRect.bottom + gap : 0,
    left: buttonRect ? buttonRect.left : 0,
  }

  const [isOpen, setIsOpen] = useState(false)
  const [editingView, setEditingView] = useState<EditingViewState>(null)
  const [selectedView, setSelectedView] = useState<SelectedViewState>(null)

  //   any clicks outside the modal should close it
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!buttonRef.current?.contains(target) && !modalRef.current?.contains(target) && isOpen) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleChangeView = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      // get id from target
      const target = e.currentTarget as HTMLLIElement
      const viewId = target.id
      if (viewId) {
        setSelectedView(viewId)
        setIsOpen(false) // close the modal after selecting a view
      }
    },
    [setSelectedView],
  )

  const handleEditView = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    const target = e.currentTarget.closest('li')
    if (target) {
      const viewId = target.id
      if (viewId) {
        setEditingView(viewId)
        setIsOpen(false) // close the modal after editing a view
      }
    }
  }, [])

  const newViewButton: ViewMenuItem = useMemo(
    () => ({
      id: NEW_VIEW_ID,
      label: 'Create new view',
      startContent: <Icon icon="add" />,
      endContent: !powerLicense && <PowerIcon icon="bolt" />,
      onClick: (e) => {
        e.stopPropagation()
        if (!powerLicense) {
          setPowerpackDialog('sharedViews')
        } else {
          setEditingView(NEW_VIEW_ID)
        }
        setIsOpen(false) // close the modal after clicking new view
      },
    }),
    [setEditingView, setIsOpen, powerLicense],
  )

  const personalView: ViewMenuItem = useMemo(
    () => ({
      ...personalBaseView,
      onClick: handleChangeView,
    }),
    [handleChangeView],
  )

  const viewItems: ViewMenuItem[] = useMemo(() => [personalView, newViewButton], [personalView])

  const handleButtonClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    // prevent default action
    e.preventDefault()
    e.stopPropagation()
    setIsOpen((prev) => !prev)
  }

  return (
    <>
      <Styled.ViewsButton
        icon="view_quilt"
        ref={buttonRef}
        onClick={handleButtonClick}
        className={clsx({ active: !!selectedView, open: isOpen })}
      />
      {isOpen &&
        createPortal(
          <Styled.ViewsModal style={modalPosition} ref={modalRef}>
            <ViewsMenu items={viewItems} selected={selectedView} />
          </Styled.ViewsModal>,
          document.body,
        )}
    </>
  )
}
