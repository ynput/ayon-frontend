// this is a wrapper around the DetailsPanel
// we do this so that focused changes do not re-render the entire page

import { DetailsPanel, DetailsPanelSlideOut } from '@shared/containers'
import { useGetUsersAssigneeQuery } from '@shared/api'
import type { DetailsPanelEntityData, ProjectModel } from '@shared/api'
import {
  parseCellId,
  ROW_SELECTION_COLUMN_ID,
  useSelectionCellsContext,
} from '@shared/containers/ProjectTreeTable'
import { useAppDispatch } from '@state/store'
import { openViewer } from '@state/viewer'
import { useVersionsSelectionContext } from '@pages/VersionsProductsPage/context/VPSelectionContext'
import { useCallback } from 'react'
import { useProjectContext } from '@shared/context'
import useGoToEntity from '@hooks/useGoToEntity'
import { useVPViewsContext } from '@pages/VersionsProductsPage/context/VPViewsContext'
import { useVersionsDataContext } from '@pages/VersionsProductsPage/context/VPDataContext'
import { useSlicerContext } from '@context/SlicerContext'

type VPDetailsPanelProps = {}

const VPDetailsPanel = ({}: VPDetailsPanelProps) => {
  const dispatch = useAppDispatch()
  const handleOpenViewer = (args: any) => dispatch(openViewer(args))

  const { projectName, ...projectInfo } = useProjectContext()
  const { selectedVersions, setSelectedVersions, showVersionDetails } =
    useVersionsSelectionContext()
  const { setSelectedCells, selectedRows } = useSelectionCellsContext()
  const { onUpdateGroupBy, onUpdateFilters } = useVPViewsContext()
  const { setExpanded: setProductsExpanded } = useVersionsDataContext()
  const slicer = useSlicerContext()

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

  const { goToEntity } = useGoToEntity({
    page: 'products',
    onViewUpdate: () => {
      // clear all filters
      onUpdateFilters({})
      // remove any group by
      onUpdateGroupBy(undefined)
    },
    onExpandFolders: (expanded, selected) => {
      slicer.setExpanded(expanded) // expand slicer folders
      slicer.setRowSelection(selected)
    }, // expand folders
    onSelection: (selectedIds: string[]) => setSelectedCells(new Set(selectedIds)), // select entities
    onParentSelection: (parentId: string) => {
      //  expand the parent product in versions table
      setProductsExpanded({ [parentId]: true })
    },
  })

  // select the entity in the table and expand its parent folders
  const handleUriOpen = (entity: DetailsPanelEntityData) => {
    console.debug('URI found, selecting and expanding folders to entity:', entity.name)
    goToEntity(entity.id, entity.entityType, {
      folder: entity.folder?.id,
      product: entity.product?.id,
    })
  }

  return (
    <>
      <DetailsPanel
        isOpen={showVersionDetails}
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
        onUriOpen={handleUriOpen}
      />
      <DetailsPanelSlideOut projectsInfo={projectsInfo} scope="overview" />
    </>
  )
}

export default VPDetailsPanel
