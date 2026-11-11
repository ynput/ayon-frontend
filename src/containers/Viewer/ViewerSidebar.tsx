import { useEffect, useMemo, useState } from 'react'
import { usePlayerContext } from '@ynput/ayon-player'
import type { SidebarProps } from '@ynput/ayon-player/plugins'
import { DetailsPanel, DetailsPanelSlideOut } from '@shared/containers'
import { useGetProjectsInfoQuery, useGetUsersAssigneeQuery } from '@shared/api'
import { useDetailsPanelContext, type ProjectModelWithProducts } from '@shared/context'
import { isHTMLElement } from '@shared/util'
import { EntityListsContextBoundary } from '@pages/ProjectListsPage/context'
import * as Styled from './Viewer.styled'

// The viewer's details panel, as the player's Sidebar plugin. It shows the version of the
// current clip, and its feed and annotations work with the player's frames.
const ViewerSidebar = ({ clipStore, playback, allAnnotations }: SidebarProps) => {
  const { projectName = '' } = usePlayerContext()
  const currentVersionId = clipStore.clips[clipStore.currentClip]?.context.versionId ?? ''

  // while playing a timeline, keep the panel on one version instead of following every clip
  const [versionId, setVersionId] = useState(currentVersionId)
  useEffect(() => {
    if (!playback.playing) setVersionId(currentVersionId)
  }, [currentVersionId, playback.playing])

  const { data = {} } = useGetProjectsInfoQuery(
    { projects: projectName ? [projectName] : [] },
    { skip: !projectName },
  )
  // only the requested project, whose info is there once loaded
  const projectsInfo = data as Record<string, ProjectModelWithProducts>
  const { data: users = [] } = useGetUsersAssigneeQuery({ projectName }, { skip: !projectName })

  const entities = useMemo(
    () => (versionId ? [{ id: versionId, projectName, entityType: 'version' }] : []),
    [versionId, projectName],
  )

  // The viewer dialog closes on Escape and only knows the page's slide-out. This panel has its
  // own (the player's details panel provider), so close that first.
  const { slideOut, closeSlideOut } = useDetailsPanelContext()
  useEffect(() => {
    if (!slideOut?.entityId) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (isHTMLElement(e.target)) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
        if (e.target.isContentEditable) return
      }
      e.stopPropagation()
      closeSlideOut()
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [slideOut?.entityId, closeSlideOut])

  if (!projectName) return null
  const projectInfo = projectsInfo[projectName]

  return (
    <EntityListsContextBoundary projectName={projectName}>
      {(entityListsContext) => (
        <Styled.Sidebar className="viewer-details-panel">
          {!!entities.length && (
            <DetailsPanel
              isOpen
              entities={entities}
              tagsOptions={projectInfo?.tags || []}
              projectUsers={users}
              activeProjectUsers={users}
              disabledProjectUsers={[]}
              projectsInfo={projectsInfo}
              projectNames={[projectName]}
              entityType="version"
              scope="review"
              style={{ boxShadow: 'none', borderRadius: 4, overflow: 'hidden' }}
              entityListsContext={entityListsContext}
              annotations={allAnnotations?.unsavedAnnotations}
              removeAnnotation={allAnnotations?.removeAnnotation}
              exportAnnotationComposite={allAnnotations?.exportAnnotationComposite}
            />
          )}
          <DetailsPanelSlideOut projectsInfo={projectsInfo} scope="review" />
        </Styled.Sidebar>
      )}
    </EntityListsContextBoundary>
  )
}

export default ViewerSidebar
