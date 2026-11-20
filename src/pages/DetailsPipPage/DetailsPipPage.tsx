// The details panel on its own, for the picture-in-picture window (see detailsPip.ts): the
// entities come from the URL, the viewer opens in the window that opened the PiP.
import { useMemo } from 'react'
import styled from 'styled-components'
import { uniq } from 'lodash'
import {
  DetailsPanel,
  DetailsPanelSlideOut,
  DETAILS_PIP_OPEN_VIEWER,
  parseDetailsPipUrl,
} from '@shared/containers'
import { useGetKanbanProjectUsersQuery, useGetProjectsInfoQuery } from '@shared/api'
import { UploadVersionDialog, VersionUploadProvider } from '@shared/components'
import { ProjectContextProvider } from '@shared/context'
import { EntityListsContextBoundary } from '@pages/ProjectListsPage/context'
import { useAppDispatch } from '@state/store'
import mergeProjectInfo from '@shared/containers/DetailsPanel/helpers/mergeProjectInfo'

const Page = styled.main`
  position: relative;
  height: 100vh;
  overflow: hidden;

  .details-panel {
    height: 100%;
    border-radius: 0;
  }
`

const DetailsPipPage = () => {
  const dispatch = useAppDispatch()
  const pip = useMemo(() => parseDetailsPipUrl(window.location.search), [])
  const entities = useMemo(() => pip?.entities || [], [pip])
  const projectNames = useMemo(() => uniq(entities.map((e) => e.projectName)), [entities])
  const projectName = projectNames[0] || ''

  const { data: projectsInfo = {} } = useGetProjectsInfoQuery(
    { projects: projectNames },
    { skip: !projectNames.length },
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

  const handleOpenViewer = (args: any) =>
    window.parent.postMessage({ type: DETAILS_PIP_OPEN_VIEWER, args }, window.location.origin)

  if (!pip) return null

  return (
    <Page>
      <EntityListsContextBoundary
        projectName={projectNames.length === 1 ? projectName : undefined}
      >
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
                onOpenViewer={handleOpenViewer}
                style={{ boxShadow: 'none' }}
              />
              <DetailsPanelSlideOut projectsInfo={projectsInfo} scope="pip" />
              <UploadVersionDialog />
            </VersionUploadProvider>
          </ProjectContextProvider>
        )}
      </EntityListsContextBoundary>
    </Page>
  )
}

export default DetailsPipPage
