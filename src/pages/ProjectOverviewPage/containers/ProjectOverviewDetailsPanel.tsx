// this is a wrapper around the DetailsPanel
// we do this so that focused changes do not re-render the entire page

import { useMemo, type ReactNode } from 'react'
import { DetailsPanel, DetailsPanelSlideOut } from '@shared/containers'
import { useGetUsersAssigneeQuery } from '@shared/api'
import type { DetailsPanelEntityData, ProjectModel } from '@shared/api'
import {
  useProjectTableContext,
  useSelectedRowsContext,
  useDetailsPanelEntityContext,
  useSelectionCellsContext,
  parseCellId,
  ROW_SELECTION_COLUMN_ID,
} from '@shared/containers/ProjectTreeTable'
import { EntityMap } from '@shared/containers/ProjectTreeTable'
import {
  isDeletableEntityType,
  DetailsPanelDeleteSelectionContext,
  type DeletableEntity,
} from '@shared/context'
import { useAppDispatch } from '@state/store'
import { openViewer } from '@state/viewer'
import { EntityListsContextBoundary } from '@pages/ProjectListsPage/context'

type ProjectOverviewDetailsPanelProps = {
  projectInfo?: ProjectModel
  projectName: string
  entityListId?: string
  isOpen?: boolean
  onUriOpen?: (entity: DetailsPanelEntityData, source: 'uri' | 'url') => void
  onClose?: () => void
  dispatch: any // if we need to provide explicit dispatch context (for review)
}

type EntitySelection = {
  entities: Array<{ id: string; projectName: string }>
  entityType: 'folder' | 'task' | 'version'
  handleClose: () => void
}

const ProjectOverviewDetailsPanel = ({
  projectInfo,
  projectName,
  entityListId,
  isOpen,
  onUriOpen,
  onClose,
  dispatch: dispatchProp,
}: ProjectOverviewDetailsPanelProps) => {
  const dispatch = dispatchProp || useAppDispatch()
  const handleOpenViewer = (args: any) => dispatch(openViewer(args))

  const { getEntityById } = useProjectTableContext()
  const { selectedRows, clearRowsSelection } = useSelectedRowsContext()

  const { data: users = [] } = useGetUsersAssigneeQuery(
    { names: undefined, projectName },
    { skip: !projectName },
  )

  // Try to get the entity context, but it might not exist
  const entityContext = useDetailsPanelEntityContext()
  const selectedEntity = entityContext?.selectedEntity || null
  const clearSelectedEntity = entityContext?.clearSelectedEntity

  // Early return if no project info is available
  if (!projectInfo || !projectName) {
    return null
  }
  const projectsInfo = { [projectName]: projectInfo }

  // Get entity selection data
  const entitySelection = getEntitySelection({
    selectedRows,
    selectedEntity,
    getEntityById,
    clearRowsSelection,
    clearSelectedEntity,
    projectName,
  })

  const isPanelOpen = !!entitySelection && (typeof isOpen !== 'boolean' || isOpen)

  const { entities, entityType, handleClose } = entitySelection || {}

  return (
    <EntityListsContextBoundary projectName={projectName}>
      {(entityListsContext) => (
        <>
          <OverviewDeleteSelection projectName={projectName}>
            <DetailsPanel
              isOpen={isPanelOpen}
              entityType={entityType}
              entityListId={entityListId}
              entities={entities}
              projectsInfo={projectsInfo}
              projectNames={[projectName]}
              tagsOptions={projectInfo.tags || []}
              projectUsers={users}
              activeProjectUsers={users}
              style={{ boxShadow: 'none' }}
              scope="overview"
              entityListsContext={entityListsContext}
              onClose={() => {
                handleClose?.()
                onClose?.()
              }}
              onOpenViewer={handleOpenViewer}
              onUriOpen={onUriOpen}
            />
          </OverviewDeleteSelection>
          <DetailsPanelSlideOut projectsInfo={projectsInfo} scope="overview" />
        </>
      )}
    </EntityListsContextBoundary>
  )
}

/**
 * Subscribes to the tree table's cell selection and publishes the resulting delete target via
 * context. Kept as its own component so cell-selection changes re-render only this provider
 * (and the more-menu that consumes it) instead of the whole details panel. Its `children` stay
 * referentially stable across cell-nav because the parent doesn't subscribe to cell selection.
 */
function OverviewDeleteSelection({
  projectName,
  children,
}: {
  projectName: string
  children: ReactNode
}) {
  const { getEntityById } = useProjectTableContext()
  const { selectedCells } = useSelectionCellsContext()

  // Delete acts on the cell selection (matching the toolbar / context-menu delete), not the
  // row-selection-driven panel entities. Empty here → more-menu falls back to panel entities.
  const deleteEntities = useMemo<DeletableEntity[]>(() => {
    const rowIds: string[] = []
    for (const cellId of selectedCells) {
      const { rowId, colId } = parseCellId(cellId) || {}
      if (!rowId || colId === ROW_SELECTION_COLUMN_ID || rowIds.includes(rowId)) continue
      rowIds.push(rowId)
    }
    return rowIds.reduce<DeletableEntity[]>((acc, rowId) => {
      const entity = getEntityById(rowId)
      if (!entity || !isDeletableEntityType(entity.entityType)) return acc
      const { entityId, id, name, label, folderId, parentId } = entity as {
        entityId?: string
        id?: string
        name?: string
        label?: string | null
        folderId?: string | null
        parentId?: string
      }
      const resolvedId = entityId || id
      if (!resolvedId) return acc
      acc.push({
        id: resolvedId,
        entityType: entity.entityType,
        name,
        label,
        projectName,
        folderId: folderId ?? undefined,
        parentId,
      })
      return acc
    }, [])
  }, [selectedCells, getEntityById, projectName])

  return (
    <DetailsPanelDeleteSelectionContext.Provider value={deleteEntities}>
      {children}
    </DetailsPanelDeleteSelectionContext.Provider>
  )
}

/**
 * Determines the entity selection based on row selection and entity context
 */
function getEntitySelection({
  selectedRows,
  selectedEntity,
  getEntityById,
  clearRowsSelection,
  clearSelectedEntity,
  projectName,
}: {
  selectedRows: string[]
  selectedEntity: { entityId: string; entityType: 'folder' | 'task' | 'version' } | null
  getEntityById: (id: string, field?: string) => EntityMap | undefined
  clearRowsSelection: () => void
  clearSelectedEntity?: () => void
  projectName: string
}): EntitySelection | null {
  const hasRowSelection = selectedRows.length > 0
  const hasEntitySelection = selectedEntity !== null

  // Prioritize row selection over entity selection
  if (hasRowSelection) {
    return getRowSelectionData({
      selectedRows,
      getEntityById,
      clearRowsSelection,
      projectName,
    })
  }

  if (hasEntitySelection && clearSelectedEntity && selectedEntity) {
    return getEntitySelectionData({
      selectedEntity,
      clearSelectedEntity,
      projectName,
    })
  }

  return null
}

/**
 * Processes row selection data into entity selection format
 */
function getRowSelectionData({
  selectedRows,
  getEntityById,
  clearRowsSelection,
  projectName,
}: {
  selectedRows: string[]
  getEntityById: (id: string, field?: string) => EntityMap | undefined
  clearRowsSelection: () => void
  projectName: string
}): EntitySelection | null {
  const selectedEntities = selectedRows
    .map((id) => getEntityById(id))
    .filter((entity): entity is EntityMap => entity !== undefined)

  if (selectedEntities.length === 0) {
    return null
  }

  const entityType = determineEntityType(selectedEntities)
  const filteredEntities = selectedEntities.filter((entity) => entity.entityType === entityType)

  const entities = filteredEntities.map((entity) => ({
    id: entity.entityId || entity.id,
    projectName,
  }))

  return {
    entities,
    entityType,
    handleClose: clearRowsSelection,
  }
}

/**
 * Processes entity selection data into entity selection format
 */
function getEntitySelectionData({
  selectedEntity,
  clearSelectedEntity,
  projectName,
}: {
  selectedEntity: { entityId: string; entityType: 'folder' | 'task' | 'version' }
  clearSelectedEntity: () => void
  projectName: string
}): EntitySelection | null {
  return {
    entities: [{ id: selectedEntity.entityId, projectName }],
    entityType: selectedEntity.entityType as 'folder' | 'task' | 'version',
    handleClose: clearSelectedEntity,
  }
}

/**
 * Determines the most appropriate entity type for a mixed selection
 */
function determineEntityType(entities: EntityMap[]): 'folder' | 'task' | 'version' {
  if (entities.length === 1) {
    return entities[0].entityType as 'folder' | 'task' | 'version'
  }

  const firstEntityType = entities[0].entityType
  const allSameType = entities.every((entity) => entity.entityType === firstEntityType)

  if (allSameType) {
    return firstEntityType as 'folder' | 'task' | 'version'
  }

  // For mixed selections, prioritize tasks over folders, versions over all others
  const hasVersion = entities.some((entity) => entity.entityType === 'version')
  if (hasVersion) return 'version'

  const hasTask = entities.some((entity) => entity.entityType === 'task')
  return hasTask ? 'task' : 'folder'
}

export default ProjectOverviewDetailsPanel
