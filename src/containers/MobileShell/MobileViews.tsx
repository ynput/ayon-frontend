import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  getViewsPortalId,
  useViewsContext,
  ViewsButton,
  ViewsMenuContainer,
} from '@shared/containers'
import ViewsDialogContainer from '@shared/containers/Views/ViewsDialogContainer/ViewsDialogContainer'
import { useViewsShortcuts } from '@shared/containers/Views/hooks/useViewsShortcuts'
import * as Styled from './MobileShell.styled'
import { useHeaderViewsSlot } from './MobileShellHelpers'

const MobileViews = () => {
  useViewsShortcuts()
  const { viewType } = useViewsContext()
  const [target, setTarget] = useState<HTMLElement | null>(null)
  const headerSlot = useHeaderViewsSlot()

  if (!viewType || !headerSlot) return null

  return (
    <>
      {createPortal(
        <Styled.ViewsTarget
          id={getViewsPortalId(viewType)}
          ref={setTarget}
          role="group"
          aria-label="Views"
        />,
        headerSlot,
      )}
      {target && <ViewsButton />}
      <ViewsMenuContainer />
      <ViewsDialogContainer />
    </>
  )
}

export default MobileViews
