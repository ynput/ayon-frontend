// this is a wrapper around the DetailsPanel
// we do this so that focused changes do not re-render the entire page

import { DetailsPanel, DetailsPanelSlideOut } from '@shared/containers'
import { useEntityListsContext } from '@pages/ProjectListsPage/context'
import { detailsPanelEntityTypes, useGetUsersAssigneeQuery } from '@shared/api'
import type { ProjectModel } from '@shared/api'
import {
  useProjectTableContext,
  useSelectedRowsContext,
  useDetailsPanelEntityContext,
} from '@shared/containers/ProjectTreeTable'
import { EntityMap } from '@shared/containers/ProjectTreeTable'
import { useAppDispatch } from '@state/store'
import { openViewer } from '@state/viewer'

type ProjectOverviewDetailsPanelProps = {
  projectInfo?: ProjectModel
  projectName: string
  selectedList?: any
  currentListItems?: any[]
  currentListId?: string
}

type EntitySelection = {
  entities: Array<{ id: string; projectName: string }>
  entityType: 'folder' | 'task' | 'version'
  handleClose: () => void
}

const ProjectOverviewDetailsPanel = ({
  projectInfo,
  projectName,
}: ProjectOverviewDetailsPanelProps) => {
  const dispatch = useAppDispatch()
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

  // Early return if no entities are selected
  if (!entitySelection) {
    return null
  }

  const { entities, entityType, handleClose } = entitySelection
  // check that entityType is supported
  if (!detailsPanelEntityTypes.includes(entityType)) {
    console.warn(`Unsupported entity type: ${entityType}`)
    return null
  }

  return (
    <>
      <DetailsPanel
        entityType={entityType}
        entities={entities}
        projectsInfo={projectsInfo}
        projectNames={[projectName]}
        tagsOptions={projectInfo.tags || []}
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
  selectedEntity: { entityId: string; entityType: 'folder' | 'task' } | null
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
  selectedEntity: { entityId: string; entityType: 'folder' | 'task' }
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
