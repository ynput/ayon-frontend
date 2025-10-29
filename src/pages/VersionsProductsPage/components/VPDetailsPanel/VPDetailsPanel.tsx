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
import { useVersionsSelectionContext } from '@pages/VersionsProductsPage/context/VPSelectionContext'
import { useCallback } from 'react'

type VPDetailsPanelProps = {}

const VPDetailsPanel = ({}: VPDetailsPanelProps) => {
  const dispatch = useAppDispatch()
  const handleOpenViewer = (args: any) => dispatch(openViewer(args))

  const { projectName, projectInfo } = useProjectDataContext()
  const { selectedVersions, setSelectedVersions } = useVersionsSelectionContext()
  const { setSelectedCells, selectedRows } = useSelectionCellsContext()

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

  const handleDetailsOpen = useCallback(() => {
    // Scroll to the selected grid item at the top when details panel opens
    const gridContainer = document.querySelector('[data-grid-container="true"]') as HTMLDivElement
    if (!gridContainer || !selectedRows.length) return

    // Find the first selected version's card element
    const selectedVersionId = selectedRows[0]
    const selectedElement = gridContainer.querySelector(
      `[data-entity-id="${selectedVersionId}"]`,
    ) as HTMLElement

    if (selectedElement) {
      // Scroll to the element at the top with some padding
      const scrollTop = selectedElement.offsetTop - gridContainer.offsetTop
      gridContainer.scrollTo({
        top: scrollTop,
        behavior: 'instant',
      })
    }
  }, [selectedRows])

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
        onOpen={handleDetailsOpen}
      />
      <DetailsPanelSlideOut projectsInfo={projectsInfo} scope="overview" />
    </>
  )
}

export default VPDetailsPanel
