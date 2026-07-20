// this is a wrapper around the DetailsPanel
// we do this so that focused changes do not re-render the entire page

import { DetailsPanel, DetailsPanelSlideOut } from '@shared/containers'
import { useGetUsersAssigneeQuery } from '@shared/api'
import type { DetailsPanelEntityData, ProjectModel } from '@shared/api'
import {
  parseCellId,
  parseRowId,
  ROW_SELECTION_COLUMN_ID,
  useSelectionCellsContext,
  getCellId,
} from '@shared/containers/ProjectTreeTable'
import { useAppDispatch } from '@state/store'
import { openViewer } from '@state/viewer'
import { useVersionsSelectionContext } from '@pages/VersionsProductsPage/context/VPSelectionContext'
import { useCallback, useMemo } from 'react'
import { useProjectContext, isDeletableEntityType, type DeletableEntity } from '@shared/context'
import useGoToEntity from '@hooks/useGoToEntity'
import { useVPViewsContext } from '@pages/VersionsProductsPage/context/VPViewsContext'
import { useVersionsDataContext } from '@pages/VersionsProductsPage/context/VPDataContext'
import { useSlicerContext } from '@shared/containers/Slicer'
import { EntityListsContextBoundary } from '@pages/ProjectListsPage/context'

type VPDetailsPanelProps = {}

const VPDetailsPanel = ({}: VPDetailsPanelProps) => {
  const dispatch = useAppDispatch()
  const handleOpenViewer = (args: any) => dispatch(openViewer(args))

  const { projectName, ...projectInfo } = useProjectContext()
  const { selectedVersions, setSelectedVersions, showVersionDetails } =
    useVersionsSelectionContext()
  const { setSelectedCells, selectedRows, selectedCells } = useSelectionCellsContext()
  const { onUpdateViewGroupBy, onUpdateFilters } = useVPViewsContext()
  const { setExpanded: setProductsExpanded, entitiesMap } = useVersionsDataContext()
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

  // Delete acts on the cell selection (matching the context-menu delete), not the
  // row-selection-driven panel entities. Resolves both versions and products.
  const deleteEntities = useMemo<DeletableEntity[]>(() => {
    const entityIds = new Set<string>()
    for (const cellId of selectedCells) {
      const { rowId, colId } = parseCellId(cellId) || {}
      if (!rowId || colId === ROW_SELECTION_COLUMN_ID) continue
      entityIds.add(parseRowId(rowId))
    }
    const result: DeletableEntity[] = []
    entityIds.forEach((entityId) => {
      const entity = entitiesMap.get(entityId)
      if (!entity || !isDeletableEntityType(entity.entityType)) return
      result.push({
        id: entity.id,
        entityType: entity.entityType,
        name: entity.name,
        label: entity.label,
        projectName,
        folderId: entity.folderId || undefined,
      })
    })
    return result
  }, [selectedCells, entitiesMap, projectName])

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

  const { getGoToEntityData } = useGoToEntity()

  // select the entity in the table and expand its parent folders
  const handleUriOpen = (entity: DetailsPanelEntityData, source: 'uri' | 'url') => {
    console.debug('URI found, selecting and expanding folders to entity:', entity.name)

    // Get the data needed to navigate to this entity
    const data = getGoToEntityData(entity.id, entity.entityType as any, {
      folder: entity.folder?.id,
      product: entity.product?.id,
    })

    // Only reset view state
    if (source === 'uri') {
      onUpdateFilters({})
      onUpdateViewGroupBy(undefined)
    }

    // Expand folders in slicer
    slicer.onExpandedChange(data.expandedFolders)
    slicer.onRowSelectionChange(data.selectedFolders)

    // Select the entity in the table
    setSelectedCells(
      new Set([
        getCellId(data.entityId, 'name'),
        getCellId(data.entityId, ROW_SELECTION_COLUMN_ID),
      ]),
    )

    // For versions, expand the parent product
    if (entity.entityType === 'version' && entity.product?.id) {
      setProductsExpanded({ [entity.product.id]: true })
    }
  }

  return (
    <EntityListsContextBoundary projectName={projectName}>
      {(entityListsContext) => (
        <>
          <DetailsPanel
            isOpen={showVersionDetails}
            entityType={'version'}
            entities={entities}
            deleteEntitiesOverride={deleteEntities}
            projectsInfo={projectsInfo}
            projectNames={[projectName]}
            tagsOptions={projectInfo?.tags || []}
            projectUsers={users}
            activeProjectUsers={users}
            style={{ boxShadow: 'none' }}
            scope="overview"
            entityListsContext={entityListsContext}
            onClose={handleClose}
            onOpenViewer={handleOpenViewer}
            onOpen={handleDetailsOpen}
            onUriOpen={handleUriOpen}
          />
          <DetailsPanelSlideOut projectsInfo={projectsInfo} scope="overview" />
        </>
      )}
    </EntityListsContextBoundary>
  )
}

export default VPDetailsPanel
