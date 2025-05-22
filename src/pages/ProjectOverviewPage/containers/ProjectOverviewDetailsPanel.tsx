// this is a wrapper around the DetailsPanel
// we do this so that focused changes do not re-render the entire page

import { DetailsPanel, DetailsPanelSlideOut } from '@shared/containers'
import { useGetUsersAssigneeQuery } from '@shared/api'
import type { ProjectModel } from '@shared/api'
import { useProjectTableContext, useSelectedRowsContext } from '@shared/containers/ProjectTreeTable'
import { EditorTaskNode, MatchingFolder } from '@shared/containers/ProjectTreeTable'
import { useAppDispatch } from '@state/store'
import { openViewer } from '@state/viewer'

type ProjectOverviewDetailsPanelProps = {
  projectInfo?: ProjectModel
  projectName: string
}

const ProjectOverviewDetailsPanel = ({
  projectInfo,
  projectName,
}: ProjectOverviewDetailsPanelProps) => {
  const dispatch = useAppDispatch()
  const handleOpenViewer = (args: any) => dispatch(openViewer(args))

  const { getEntityById } = useProjectTableContext()
  const { selectedRows, clearRowsSelection } = useSelectedRowsContext()

  const selectRowData = selectedRows.map((id) => getEntityById(id)).filter(Boolean) as
    | (MatchingFolder | EditorTaskNode)[]
    | undefined

  if (!selectRowData || !selectRowData.length) return null
  // task types will always take priority over folder types, we can only have one type at one time
  const entityType = selectRowData.every((row) => row.entityType === selectRowData[0].entityType)
    ? selectRowData[0].entityType
    : selectRowData.some((row) => row.entityType === 'task')
    ? 'task'
    : 'folder'
  const entities = selectRowData
    .filter((row) => entityType === row.entityType)
    .map((row) => ({ id: row.entityId || row.id, projectName }))

  const handleClose = () => {
    clearRowsSelection()
  }

  const { data: users = [] } = useGetUsersAssigneeQuery({ names: undefined, projectName })

  if (!entities.length || !entityType || !projectName || !projectInfo) return null

  const projectsInfo = { [projectName]: projectInfo }

  return (
    // @ts-nocheck
    <>
      <DetailsPanel
        entityType={entityType}
        entities={entities as any}
        projectsInfo={projectsInfo}
        projectNames={[projectName] as any}
        tagsOptions={projectInfo?.tags || []}
        projectUsers={users}
        activeProjectUsers={users}
        style={{ boxShadow: 'none' }}
        scope="overview"
        onClose={handleClose}
        onOpenViewer={handleOpenViewer}
      />
      <DetailsPanelSlideOut projectsInfo={projectsInfo} scope="overview" />
    </>
  )
}

export default ProjectOverviewDetailsPanel
