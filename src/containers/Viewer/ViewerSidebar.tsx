import { useContext } from 'react'
import { usePlayerContext } from '@ynput/ayon-player'
import type { SidebarProps } from '@ynput/ayon-player/plugins'
import ViewerDetails from './ViewerDetails'
import { ViewerCloseContext } from './ViewerCloseContextInstance'

// The viewer's details panel, as the player's Sidebar plugin. It follows the current clip's
// version (also while a timeline plays, so a comment's frame belongs to the version it is on),
// and its feed and annotations work with the player's frames.
const ViewerSidebar = ({ clipStore, allAnnotations }: SidebarProps) => {
  const { projectName = '' } = usePlayerContext()
  const versionId = clipStore.clips[clipStore.currentClip]?.context.versionId
  const onClose = useContext(ViewerCloseContext)

  return (
    <ViewerDetails
      projectName={projectName}
      versionId={versionId}
      annotations={allAnnotations}
      onClose={onClose}
    />
  )
}

export default ViewerSidebar
