import { FC, useState } from 'react'
import {
  getViewsPortalId,
  useViewsContext,
  ViewsButton,
  ViewsMenuContainer,
} from '@shared/containers'
import ViewsDialogContainer from '@shared/containers/Views/ViewsDialogContainer/ViewsDialogContainer'
import { useViewsShortcuts } from '@shared/containers/Views/hooks/useViewsShortcuts'
import { EVENTS_VIEW_TYPE } from '../constants'

/**
 * This page has no tab to hold the views button, so it goes in the toolbar. Views features that
 * need a Power Pack licence (saving and sharing views) are gated by the views menu itself.
 */
export const EventsViews: FC = () => {
  useViewsShortcuts()
  const { editingViewId } = useViewsContext()
  // ViewsButton looks its portal up while rendering, so it has to wait for the element
  const [portal, setPortal] = useState<HTMLElement | null>(null)

  return (
    <>
      <span id={getViewsPortalId(EVENTS_VIEW_TYPE)} ref={setPortal} />
      {portal && (
        <ViewsButton
          fullButton
          fullButtonProps={(selectedView) => ({
            label: selectedView?.working ? 'Views' : selectedView?.label ?? 'Views',
            // also while a saved view has unsaved changes, which puts us on the working view
            selected: (!!selectedView && !selectedView.working) || !!editingViewId,
          })}
        />
      )}
      <ViewsMenuContainer />
      <ViewsDialogContainer />
    </>
  )
}
