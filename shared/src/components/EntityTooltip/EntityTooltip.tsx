import * as Styled from './EntityTooltip.styled'
import { useGetEntityTooltipQuery } from '@shared/api'
import { Status } from '@shared/containers/ProjectTreeTable/types/project'
import { useOptionalProjectContext } from '@shared/context/ProjectContext'
import { getEntityThumbnailUrl, getEntityTypeIcon } from '@shared/util'

// entity types the tooltip query returns data for
export const ENTITY_TOOLTIP_TYPES = ['folder', 'task', 'version', 'workfile']

export interface EntityTooltipProjectInfo {
  taskTypes?: { name: string; icon?: string }[]
  folderTypes?: { name: string; icon?: string }[]
  statuses?: Status[]
}

export interface EntityTooltipProps {
  entityType?: string
  entityId?: string
  projectName?: string
  pos?: {
    left?: number
    top?: number
  }
  projectInfo?: EntityTooltipProjectInfo
}

export const EntityTooltip: React.FC<EntityTooltipProps> = ({
  entityType,
  entityId,
  projectName,
  pos: { left = 0, top = 0 } = {},
  projectInfo,
}) => {
  const project = useOptionalProjectContext()
  const resolvedProjectName = projectName || project?.projectName

  const isSupported = !!entityType && ENTITY_TOOLTIP_TYPES.includes(entityType)

  const { data, isFetching } = useGetEntityTooltipQuery(
    { entityType, entityId, projectName: resolvedProjectName },
    { skip: !isSupported || !entityId || !resolvedProjectName },
  )

  const width = 220

  // check x is not offScreen
  if (left + width / 2 > window.innerWidth) left = window.innerWidth - width / 2

  const {
    title,
    subTitle,
    path,
    taskType,
    folderType,
    productType,
    users = [],
    thumbnailId,
    status,
    thumbnailHash,
  } = data || {}

  const taskTypes = projectInfo?.taskTypes || project?.taskTypes || []
  const folderTypes = projectInfo?.folderTypes || project?.folderTypes || []
  const statuses = projectInfo?.statuses || project?.statuses || []

  const statusObject = statuses.find((s: Status) => s.name === status)
  const thumbnailUrl = getEntityThumbnailUrl({
    entityId: entityId || '',
    entityType,
    thumbnailHash,
    thumbnailId,
    projectName: resolvedProjectName || '',
  })

  const icons: Record<string, string | undefined> = {
    task: taskTypes.find((type) => type.name === taskType)?.icon,
    folder: folderTypes.find((type) => type.name === folderType)?.icon,
    version: project?.getProductType(productType as string).icon,
    workfile: getEntityTypeIcon('workfile'),
  }

  if (!isSupported) return null

  return (
    <Styled.TooltipEntityCard
      style={{ left, top, maxWidth: width }}
      title={title}
      header={subTitle}
      path={path}
      showPath
      status={statusObject as any}
      users={users}
      hidePriority
      isLoading={isFetching}
      loadingSections={['header', 'title', 'users', 'status']}
      titleIcon={icons[entityType || ''] as any}
      imageUrl={thumbnailUrl || undefined}
    />
  )
}

export default EntityTooltip
