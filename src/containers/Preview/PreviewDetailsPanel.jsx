// mainly just a wrapper for data fetching

import DetailsPanel from '/src/containers/DetailsPanel/DetailsPanel'
import { useGetUsersAssigneeQuery } from '/src/services/user/getUsers'
import DetailsPanelSlideOut from '/src/containers/DetailsPanel/DetailsPanelSlideOut/DetailsPanelSlideOut'
import { useGetProjectsInfoQuery } from '/src/services/userDashboard/getUserDashboard'
import { PreviewDetailsPanelWrapper } from './Preview.styled'

const PreviewDetailsPanel = ({ selected = [], projectName }) => {
  const { data: projectsInfo = {} } = useGetProjectsInfoQuery(
    { projects: [projectName] },
    { skip: !projectName },
  )

  const { data: users = [] } = useGetUsersAssigneeQuery({ projectName }, { skip: !projectName })

  const projectInfo = projectsInfo[projectName] || {}

  const entities = selected.map((id) => ({ id, projectName, entityType: 'version' }))

  if (!selected.length) return null

  return (
    <PreviewDetailsPanelWrapper>
      <DetailsPanel
        entities={entities}
        statusesOptions={projectInfo.statuses || []}
        tagsOptions={projectInfo.tags || []}
        projectUsers={users}
        activeProjectUsers={users}
        disabledProjectUsers={[]}
        projectsInfo={projectsInfo}
        projectNames={[projectName]}
        entityType={'version'}
        isCompact
        scope="preview"
        style={{ boxShadow: 'none', borderRadius: 4, overflow: 'hidden' }}
      />
      <DetailsPanelSlideOut projectsInfo={projectsInfo} scope="preview" />
    </PreviewDetailsPanelWrapper>
  )
}

export default PreviewDetailsPanel
