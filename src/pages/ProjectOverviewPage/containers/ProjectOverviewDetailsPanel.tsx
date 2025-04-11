// this is a wrapper around the DetailsPanel
// we do this so that focused changes do not re-render the entire page

import DetailsPanel from '@containers/DetailsPanel/DetailsPanel'
import DetailsPanelSlideOut from '@containers/DetailsPanel/DetailsPanelSlideOut/DetailsPanelSlideOut'
import { useGetUsersAssigneeQuery } from '@queries/user/getUsers'
import { ProjectModel } from '@api/rest/project'
import { useProjectTableContext, useSelectedRowsContext } from '@containers/ProjectTreeTable'
import { EditorTaskNode, MatchingFolder } from '@containers/ProjectTreeTable/utils/types'

type ProjectOverviewDetailsPanelProps = {
  projectInfo?: ProjectModel
  projectName: string
}

const ProjectOverviewDetailsPanel = ({
  projectInfo,
  projectName,
}: ProjectOverviewDetailsPanelProps) => {
  const projectsInfo = { [projectName]: projectInfo }

  const { getEntityById } = useProjectTableContext()
  const { selectedRows, clearRowsSelection } = useSelectedRowsContext()

  const selectRowData = selectedRows.map((id) => getEntityById(id)).filter(Boolean) as (
    | MatchingFolder
    | EditorTaskNode
  )[]
  // folder types will always take priority over task types, we can only have one type at one time
  const entityType = selectRowData.some((row) => 'parentId' in row) ? 'folder' : 'task'
  const entities = selectRowData
    .filter((row) => (entityType === 'folder' ? 'parentId' in row : 'folderId' in row))
    .map((row) => ({ id: row.id, projectName }))

  const handleClose = () => {
    clearRowsSelection()
  }

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
