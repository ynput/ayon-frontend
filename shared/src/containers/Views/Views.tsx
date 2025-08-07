import { FC } from 'react'
import { ViewsButton } from './ViewsButton/ViewsButton'
import { ViewsMenuContainer } from './ViewsMenuContainer/ViewsMenuContainer'
import ViewsDialogContainer from './ViewsDialogContainer/ViewsDialogContainer'
import { useViewsShortcuts } from './hooks/useViewsShortcuts'

// Component for use inside a ViewsProvider
export const Views: FC = () => {
  // Enable Views keyboard shortcuts:
  // - Shift+Ctrl/Cmd+0: Reset view to default settings
  useViewsShortcuts()

  return (
    <>
      <ViewsButton />
      <ViewsMenuContainer />
      <ViewsDialogContainer />
    </>
  )
}
