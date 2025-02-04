// mainly just a wrapper for data fetching

import DetailsPanel from '@containers/DetailsPanel/DetailsPanel'
import { useGetUsersAssigneeQuery } from '@queries/user/getUsers'
import DetailsPanelSlideOut from '@containers/DetailsPanel/DetailsPanelSlideOut/DetailsPanelSlideOut'
import { useGetProjectsInfoQuery } from '@queries/userDashboard/getUserDashboard'
import { ViewerDetailsPanelWrapper } from './Viewer.styled'
import { $Any } from '@types'

type Props = {
  versionIds: string[]
  projectName: string | null
}

const ViewerDetailsPanel = ({ versionIds = [], projectName }: Props) => {
  const { data: projectsInfo = {} } = useGetProjectsInfoQuery(
    { projects: projectName ? [projectName] : [] },
    { skip: !projectName },
  )

  const { data: users = [] } = useGetUsersAssigneeQuery({ projectName }, { skip: !projectName })

  const projectInfo = (projectName && projectsInfo[projectName]) || {}

  const entities = versionIds.map((id) => ({ id, projectName, entityType: 'version' }))

  return (
    <ViewerDetailsPanelWrapper>
      {!!versionIds.length && (
        // @ts-ignore
        <DetailsPanel
          entities={entities as $Any}
          tagsOptions={projectInfo.tags || ([] as $Any)}
          projectUsers={users}
          activeProjectUsers={users}
          disabledProjectUsers={[]}
          projectsInfo={projectsInfo}
          projectNames={[projectName] as $Any}
          entityType={'version'}
          scope="review"
          style={{ boxShadow: 'none', borderRadius: 4, overflow: 'hidden' }}
        />
      )}
      <DetailsPanelSlideOut projectsInfo={projectsInfo} scope="review" />
    </ViewerDetailsPanelWrapper>
  )
}

export default ViewerDetailsPanel
