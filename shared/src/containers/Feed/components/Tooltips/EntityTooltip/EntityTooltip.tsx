import * as Styled from './EntityTooltip.styled'
import { useFeedContext } from '@shared/containers/Feed'
import { Status } from '@shared/containers/ProjectTreeTable/types/project'
import { useProjectContext } from '@shared/context'
import { getEntityThumbnailUrl } from '@shared/util'

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
  const project = useProjectContext()

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
    status,
    thumbnailHash,
  } = entityTooltipData || {}

  const { taskTypes = [], statuses = [] } = projectInfo

  const taskIcon = taskTypes.find((type: any) => type.name === taskType)?.icon
  const statusObject = statuses.find((s: Status) => s.name === status)
  const thumbnailUrl = getEntityThumbnailUrl({
    entityId: id,
    entityType: type,
    thumbnailHash,
    thumbnailId,
    projectName,
  })
  const productIcon = project.getProductType(productType).icon

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
