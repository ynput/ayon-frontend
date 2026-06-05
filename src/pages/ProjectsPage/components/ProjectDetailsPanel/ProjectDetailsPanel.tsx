import { Project, useGetProjectQuery, useUpdateProjectMutation } from '@shared/api'
import { FC, useCallback, useRef, useState } from 'react'
import { Thumbnail } from '@shared/components'
import { getProjectDisplayName } from '@shared/util'
import { toast } from 'react-toastify'
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
  const [updateProject] = useUpdateProjectMutation()
  const project = projectData || data

  const [currentTab, setCurrentTab] = useState<ProjectDetailsTab>('details')

  // Stabilise thumbnail updatedAt to the value captured when this project is first shown.
  // Prevents duplicate fetches caused by list re-fetches (triggered by useGetProjectQuery)
  // returning a slightly different updatedAt for the same thumbnail.
  const prevProjectNameRef = useRef<string | undefined>(undefined)
  const thumbnailUpdatedAtRef = useRef<string | undefined>(undefined)
  if (prevProjectNameRef.current !== projectName) {
    prevProjectNameRef.current = projectName
    thumbnailUpdatedAtRef.current = data?.updatedAt
  }

  const displayName = getProjectDisplayName({ name: projectName, label: project?.label })

  const updateProjectDate = useCallback(
    async (key: 'startDate' | 'endDate', value: string) => {
      // Check if the new range is valid
      const currentAttribs = (project as any)?.attrib || {}
      const start = key === 'startDate' ? value : currentAttribs.startDate
      const end = key === 'endDate' ? value : currentAttribs.endDate

      if (start && end && new Date(start) > new Date(end)) {
        toast.error(
          key === 'startDate'
            ? 'Start date cannot be after end date'
            : 'End date cannot be before start date',
        )
        return
      }

      try {
        await updateProject({
          projectName,
          projectPatchModel: { attrib: { [key]: value } },
        }).unwrap()
      } catch (error: any) {
        toast.error(`Failed to update ${key}: ` + (error?.message ?? 'Unknown error'))
      }
    },
    [project, projectName, updateProject],
  )

  const renderThumbnail = useCallback(
    ({ projectName: pn, updatedAt, isFetching: fetching }: any) => (
      <Styled.Header>
        <Styled.HeaderTop>
          <ProjectTimeline
            startDate={(project as any)?.attrib?.startDate}
            endDate={(project as any)?.attrib?.endDate}
            isLoading={isFetching && !project}
            onStartDateChange={(value) => updateProjectDate('startDate', value)}
            onEndDateChange={(value) => updateProjectDate('endDate', value)}
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
    ),
    [project, isFetching, displayName, onClose, updateProjectDate, projectName],
  )

  return (
    <Styled.Container>
      <Styled.HeaderWrapper>
        <ProjectThumbnailUploader
          projectName={projectName}
          projectUpdatedAt={thumbnailUpdatedAtRef.current}
          isFetching={isFetching}
          Thumbnail={renderThumbnail}
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
