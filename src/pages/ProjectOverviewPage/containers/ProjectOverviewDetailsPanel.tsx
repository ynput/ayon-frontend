// this is a wrapper around the DetailsPanel
// we do this so that focused changes do not re-render the entire page

import DetailsPanel from '@containers/DetailsPanel/DetailsPanel'
import DetailsPanelSlideOut from '@containers/DetailsPanel/DetailsPanelSlideOut/DetailsPanelSlideOut'
import { useGetUsersAssigneeQuery } from '@queries/user/getUsers'
import { ProjectModel } from '@api/rest/project'
import { useEntitySelection } from '@containers/ProjectTreeTable/context/EntitySelectionContext'

type ProjectOverviewDetailsPanelProps = {
  projectInfo?: ProjectModel
  projectName: string
}

const ProjectOverviewDetailsPanel = ({
  projectInfo,
  projectName,
}: ProjectOverviewDetailsPanelProps) => {
  const projectsInfo = { [projectName]: projectInfo }

  const { selectedItems, clearSelection } = useEntitySelection()

  const entities = selectedItems.map((item) => ({ id: item.id, projectName }))

  const handleClose = () => {
    clearSelection()
  }
  const entityType = selectedItems[0]?.entityType

  const { data: users = [] } = useGetUsersAssigneeQuery({ names: undefined, projectName })

  if (!entities.length || !entityType) return null

  return (
    // @ts-nocheck
    <>
      <DetailsPanel
        // entitySubTypes={subTypes}
        entityType={entityType}
        entities={entities as any}
        projectsInfo={projectsInfo}
        projectNames={[projectName] as any}
        // @ts-ignore
        tagsOptions={projectInfo?.tags || []}
        projectUsers={users}
        activeProjectUsers={users}
        style={{ boxShadow: 'none' }}
        scope="overview"
        onClose={handleClose}
      />
      <DetailsPanelSlideOut projectsInfo={projectsInfo} scope="overview" />
    </>
  )
}

export default ProjectOverviewDetailsPanel
