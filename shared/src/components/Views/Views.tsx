import { FC, useCallback, useMemo, useRef, useState } from 'react'
import * as Styled from './Views.styled'
import { ViewMenuItem } from './ViewMenuItem/ViewMenuItem'
import { ViewsMenu } from './ViewsMenu'

const personalBaseView: ViewMenuItem = {
  id: 'personal',
  label: 'Personal',
  startIcon: 'person',
  isEditable: false,
}

const dummyViews: ViewMenuItem[] = [
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

type SelectedView = string | null // id of view otherwise null with use personal

export interface ViewsProps {
  viewType: 'overview'
  projectName?: string
}

export const Views: FC<ViewsProps> = ({ viewType, projectName }) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const buttonRect = buttonRef.current?.getBoundingClientRect()
  const modalPosition = {
    top: buttonRect ? buttonRect.bottom : 0,
    left: buttonRect ? buttonRect.left : 0,
  }

  const [isOpen, setIsOpen] = useState(false)
  const [selectedView, setSelectedView] = useState<SelectedView>(null)

  const handleChangeView = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      // get id from target
      const target = e.target as HTMLLIElement
      const viewId = target.id
      setSelectedView(viewId)
    },
    [setSelectedView],
  )

  const viewItems: ViewMenuItem[] = useMemo(
    () =>
      [personalBaseView, ...dummyViews].map((view) => ({
        ...view,
        onClick: handleChangeView,
      })),
    [personalBaseView, dummyViews],
  )

  return (
    <>
      <Styled.ViewsButton
        variant="text"
        selected={!!selectedView}
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
      />
      {isOpen && (
        <Styled.ViewsModal style={modalPosition}>
          <ViewsMenu items={viewItems} />
        </Styled.ViewsModal>
      )}
    </>
  )
}
