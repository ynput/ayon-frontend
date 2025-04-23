import * as Styled from './EntityTooltip.styled'
import { productTypes } from '../../../../'
import { useFeedContext } from '../../../context/FeedContext'
import { Status } from '../../../../ProjectTreeTable/types/project'

interface ThumbnailUrlParams {
  entityId?: string
  entityType?: string
  thumbnailId?: string
  updatedAt?: string
  projectName?: string
}

const getThumbnailUrl = ({
  entityId,
  entityType,
  thumbnailId,
  updatedAt,
  projectName,
}: ThumbnailUrlParams) => {
  // If projectName is not provided or neither thumbnailId nor entityId and entityType are provided, return null
  if (!projectName || (!thumbnailId && (!entityId || !entityType))) return null

  // Construct the updatedAt query parameter if updatedAt is provided
  const updatedAtQueryParam = updatedAt ? `?updatedAt=${updatedAt}` : ''

  // If entityId and entityType are provided, construct the URL using them
  if (entityId && entityType) {
    const entityUrl = `/api/projects/${projectName}/${entityType}s/${entityId}/thumbnail`
    return `${entityUrl}${updatedAtQueryParam}`
  }

  // If entityId and entityType are not provided, fallback on thumbnailId
  const thumbnailUrl = `/api/projects/${projectName}/thumbnails/${thumbnailId}`
  return `${thumbnailUrl}${updatedAtQueryParam}`
}

interface EntityTooltipProps {
  type?: string
  id?: string
  pos?: {
    left?: number
    top?: number
  }
  projectName?: string
  projectInfo?: any
}

const EntityTooltip: React.FC<EntityTooltipProps> = ({
  type,
  id,
  pos: { left = 0, top = 0 } = {},
}) => {
  const { entityTooltipData, isFetchingTooltip, projectInfo, projectName } = useFeedContext()

  const width = 220

  // check x is not offScreen
  if (left + width / 2 > window.innerWidth) left = window.innerWidth - width / 2

  const {
    title,
    subTitle,
    path,
    taskType,
    productType,
    users = [],
    thumbnailId,
    updatedAt,
    status,
  } = entityTooltipData || {}

  const { task_types = [], statuses = [] } = projectInfo

  const taskIcon = task_types.find((type: any) => type.name === taskType)?.icon
  const statusObject = statuses.find((s: Status) => s.name === status)
  const thumbnailUrl = getThumbnailUrl({
    entityId: id,
    entityType: type,
    thumbnailId,
    updatedAt,
    projectName,
  })
  const productTypeData = productTypes[productType as keyof typeof productTypes]
  const productIcon = productTypeData?.icon || 'layers'

  const icons: Record<string, string | undefined> = {
    task: taskIcon,
    version: productIcon,
  }

  if (!type) return null

  return (
    <Styled.TooltipEntityCard
      style={{ left, top, maxWidth: width }}
      title={title}
      header={subTitle}
      path={path}
      showPath
      status={statusObject}
      users={users}
      hidePriority
      isLoading={isFetchingTooltip}
      loadingSections={['header', 'title', 'users', 'status']}
      titleIcon={icons[type || '']}
      imageUrl={thumbnailUrl || undefined}
    />
  )
}

export default EntityTooltip
