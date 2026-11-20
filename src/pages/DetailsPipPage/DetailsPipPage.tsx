// The details panel on its own, for the picture-in-picture window (see detailsPip.ts): the
// entities come from the URL, the viewer opens in the window that opened the PiP.
import { useMemo } from 'react'
import styled from 'styled-components'
import { uniq } from 'lodash'
import {
  closePipFromPip,
  DetailsPanel,
  DetailsPanelSlideOut,
  openViewerFromPip,
  parseDetailsPipUrl,
} from '@shared/containers'
import { useGetKanbanProjectUsersQuery, useGetProjectsInfoQuery } from '@shared/api'
import { UploadVersionDialog, VersionUploadProvider } from '@shared/components'
import { ProjectContextProvider, type ProjectModelWithProducts } from '@shared/context'
import { EntityListsContextBoundary } from '@pages/ProjectListsPage/context'
import { useAppDispatch } from '@state/store'
import mergeProjectInfo from '@shared/containers/DetailsPanel/helpers/mergeProjectInfo'

// the panel is the whole window. A div, not a main: `#root > main` pads the app's pages
const Page = styled.div`
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;

  .details-panel {
    flex: 1;
    height: 100%;
    border-radius: 0;
    box-shadow: none;
  }
`

// the slide-out (an entity opened from a breadcrumb or mention) slides out to the left of a
// docked panel, which is off screen here: show it over the panel instead
const SlideOutLayer = styled.div`
  & > * {
    max-width: none;
    animation: none;
    /* above the panel (z-index 300) */
    z-index: 310;
  }
`

const DetailsPipPage = () => {
  const dispatch = useAppDispatch()
  const pip = useMemo(() => parseDetailsPipUrl(window.location.search), [])
  const entities = useMemo(() => pip?.entities || [], [pip])
  const projectNames = useMemo(() => uniq(entities.map((e) => e.projectName)), [entities])
  const projectName = projectNames[0] || ''

  const { data: projectsInfoData } = useGetProjectsInfoQuery(
    { projects: projectNames },
    { skip: !projectNames.length },
  )
  const projectsInfo = useMemo(
    () => (projectsInfoData || {}) as Record<string, ProjectModelWithProducts>,
    [projectsInfoData],
  )
  const { data: projectUsers = [] } = useGetKanbanProjectUsersQuery(
    { projects: projectNames },
    { skip: !projectNames.length },
  )
  // only users on every project of the selection can be assigned
  const [activeProjectUsers, disabledProjectUsers] = useMemo(() => {
    const onAll = projectUsers.filter((u) => projectNames.every((p) => u.projects?.includes(p)))
    const others = projectUsers.filter((u) => !onAll.includes(u)).map((u) => u.name)
    return [onAll, others]
  }, [projectUsers, projectNames])

  const tagsOptions = useMemo(
    () => mergeProjectInfo(projectsInfo, projectNames).tags,
    [projectsInfo, projectNames],
  )

  if (!pip) return null

  return (
    <Page>
      <EntityListsContextBoundary projectName={projectNames.length === 1 ? projectName : undefined}>
        {(entityListsContext) => (
          <ProjectContextProvider projectName={projectName}>
            <VersionUploadProvider
              projectName={projectName}
              dispatch={dispatch}
              onVersionCreated={() => {}}
            >
              <DetailsPanel
                isOpen
                entityType={pip.entityType}
                entities={entities}
                projectsInfo={projectsInfo}
                projectNames={projectNames}
                tagsOptions={tagsOptions}
                projectUsers={projectUsers}
                activeProjectUsers={activeProjectUsers}
                disabledProjectUsers={disabledProjectUsers}
                scope="pip"
                entityListsContext={entityListsContext}
                onOpenViewer={openViewerFromPip}
                onClose={closePipFromPip}
              />
              <SlideOutLayer>
                <DetailsPanelSlideOut projectsInfo={projectsInfo} scope="pip" />
              </SlideOutLayer>
              <UploadVersionDialog />
            </VersionUploadProvider>
          </ProjectContextProvider>
        )}
      </EntityListsContextBoundary>
    </Page>
  )
}

export default DetailsPipPage
