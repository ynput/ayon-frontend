import * as Styled from './EntityTooltip.styled'
import { productTypes } from '@state/project'
import { getThumbnailUrl } from '@pages/UserDashboardPage/UserDashboardTasks/UserTasksContainer'
import { useGetEntityTooltipQuery } from '@queries/activities/getActivities'

interface EntityTooltipProps {
  type?: string
  id?: string
  pos?: {
    left?: number
    top?: number
  }
  projectName?: string
  projectInfo?: {
    task_types?: Array<{
      name: string
      icon: string
    }>
    statuses?: Array<{
      name: string
      [key: string]: any
    }>
    [key: string]: any
  }
}

interface EntityTooltipData {
  title?: string
  subTitle?: string
  path?: string
  taskType?: string
  productType?: string
  users?: Array<any>
  thumbnailId?: string
  updatedAt?: string
  status?: string
  [key: string]: any
}

const EntityTooltip: React.FC<EntityTooltipProps> = ({
  type,
  id,
  pos: { left = 0, top = 0 } = {},
  projectName,
  projectInfo = {},
}) => {
  const skip = !projectName || !type || !id
  const { data, isFetching } = useGetEntityTooltipQuery(
    { entityType: type, entityId: id, projectName },
    { skip: skip },
  )

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
  } = (data || {}) as EntityTooltipData

  const { task_types = [], statuses = [] } = projectInfo

  const taskIcon = task_types.find((type) => type.name === taskType)?.icon
  const statusObject = statuses.find((s) => s.name === status)
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
      isLoading={isFetching || skip}
      loadingSections={['header', 'title', 'users', 'status']}
      titleIcon={icons[type || '']}
      imageUrl={thumbnailUrl || undefined}
    />
  )
}

export default EntityTooltip
