import type { SidebarProvidersProps } from '@ynput/ayon-player/plugins'
import { DetailsPanelProvider, useDetailsPanelContext } from '@shared/context'

// The player gives the details panel its own handlers (go to frame, frame links, image preview),
// so the viewer's panel gets its own provider inside the player. It keeps what the page's
// provider gets from the app and the player doesn't know about.
const ViewerSidebarProviders = ({ children, detailsPanel }: SidebarProvidersProps) => {
  const page = useDetailsPanelContext()

  return (
    <DetailsPanelProvider
      {...detailsPanel}
      viewer={page.viewer}
      onOpenViewer={page.onOpenViewer}
      SubtasksManager={page.SubtasksManager}
    >
      {children}
    </DetailsPanelProvider>
  )
}

export default ViewerSidebarProviders
