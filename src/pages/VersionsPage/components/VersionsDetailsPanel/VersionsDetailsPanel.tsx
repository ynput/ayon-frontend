// this is a wrapper around the DetailsPanel
// we do this so that focused changes do not re-render the entire page

import { DetailsPanel, DetailsPanelSlideOut } from '@shared/containers'
import { useGetUsersAssigneeQuery } from '@shared/api'
import type { ProjectModel } from '@shared/api'
import {
  parseCellId,
  ROW_SELECTION_COLUMN_ID,
  useProjectDataContext,
  useSelectionCellsContext,
} from '@shared/containers/ProjectTreeTable'
import { useAppDispatch } from '@state/store'
import { openViewer } from '@state/viewer'
import { useVersionsSelectionContext } from '@pages/VersionsPage/context/VersionsSelectionContext'

type ProjectOverviewDetailsPanelProps = {}

const ProjectOverviewDetailsPanel = ({}: ProjectOverviewDetailsPanelProps) => {
  const dispatch = useAppDispatch()
  const handleOpenViewer = (args: any) => dispatch(openViewer(args))

  const { projectName, projectInfo } = useProjectDataContext()
  const { selectedVersions, setSelectedVersions } = useVersionsSelectionContext()
  const { setSelectedCells } = useSelectionCellsContext()

  const { data: users = [] } = useGetUsersAssigneeQuery(
    { names: undefined, projectName },
    { skip: !projectName },
  )

  const entities = selectedVersions.map((versionId) => ({
    id: versionId,
    projectName,
  }))

  const projectsInfo = { [projectName]: projectInfo as ProjectModel }

  const handleClose = () => {
    // reset selected versions and products
    setSelectedVersions([])
    // unselect only the row (filter out ROW_SELECTION_COLUMN_ID ids)
    setSelectedCells(
      (selection) =>
        new Set(
          Array.from(selection).filter(
            (cellId) => parseCellId(cellId)?.colId !== ROW_SELECTION_COLUMN_ID,
          ),
        ),
    )
  }

  return (
    <>
      <DetailsPanel
        entityType={'version'}
        entities={entities}
        projectsInfo={projectsInfo}
        projectNames={[projectName]}
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
