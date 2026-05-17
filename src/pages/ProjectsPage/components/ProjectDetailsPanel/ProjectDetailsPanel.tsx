import { Project, useGetProjectQuery } from '@shared/api'
import { FC, useState } from 'react'
import { Thumbnail } from '@shared/components'
import { getProjectDisplayName } from '@shared/util'
import * as Styled from './ProjectDetailsPanel.styled'
import ProjectTimeline from './components/ProjectTimeline'
import ProjectHeartbeat from './components/ProjectHeartbeat'
import ProjectDetailsTabs, { ProjectDetailsTab } from './components/ProjectDetailsTabs'
import ProjectInfoTab from './components/ProjectInfoTab'
import ProjectTeamsTab from './components/ProjectTeamsTab'
import { ProjectThumbnailUploader } from '../ProjectThumbnailUploader/ProjectThumbnailUploader'
import { Button } from '@ynput/ayon-react-components'

interface ProjectDetailsPanelProps {
  projectName: string
  data: Project | undefined
  onClose?: () => void
}

export const ProjectDetailsPanel: FC<ProjectDetailsPanelProps> = ({
  projectName,
  data,
  onClose,
}) => {
  const { data: projectData, isFetching } = useGetProjectQuery({ projectName })
  const project = projectData || data

  const [currentTab, setCurrentTab] = useState<ProjectDetailsTab>('details')

  const displayName = getProjectDisplayName({ name: projectName, label: project?.label })

  return (
    <Styled.Container>
      <Styled.HeaderWrapper>
        <ProjectThumbnailUploader
          projectName={projectName}
          projectUpdatedAt={project?.updatedAt}
          isFetching={isFetching}
          Thumbnail={({ projectName: pn, updatedAt, isFetching: fetching }) => (
            <Styled.Header>
              <Styled.HeaderTop>
                <ProjectTimeline
                  startDate={(project as any)?.attrib?.startDate}
                  endDate={(project as any)?.attrib?.endDate}
                  isLoading={isFetching && !project}
                />
                <Button icon="close" variant="text" onClick={onClose} />
              </Styled.HeaderTop>

              <Styled.ThumbnailRow>
                <Thumbnail
                  projectName={pn}
                  entityType="project"
                  entityUpdatedAt={updatedAt}
                  isLoading={fetching || (isFetching && !project)}
                  showBorder={false}
                  style={{ width: 120, height: 68, flexShrink: 0, borderRadius: 8 }}
                />
                <Styled.TitleBlock>
                  <h2>{displayName}</h2>
                  <ProjectHeartbeat projectName={projectName} />
                </Styled.TitleBlock>
              </Styled.ThumbnailRow>
            </Styled.Header>
          )}
        />
      </Styled.HeaderWrapper>

      <ProjectDetailsTabs
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        isLoading={isFetching && !project}
      />

      <Styled.TabContent>
        {currentTab === 'details' && (
          <ProjectInfoTab
            projectName={projectName}
            project={project as Project | undefined}
            isLoading={isFetching && !project}
          />
        )}
        {currentTab === 'teams' && <ProjectTeamsTab projectName={projectName} />}
      </Styled.TabContent>
    </Styled.Container>
  )
}
