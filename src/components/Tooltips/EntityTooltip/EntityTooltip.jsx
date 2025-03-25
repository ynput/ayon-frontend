import * as Styled from './EntityTooltip.styled'
import { productTypes } from '@state/project'
import { getThumbnailUrl } from '@pages/UserDashboardPage/UserDashboardTasks/UserTasksContainer'
import { useGetEntityTooltipQuery } from '@queries/activities/getActivities'

const EntityTooltip = ({ type, id, pos: { left, top } = {}, projectName, projectInfo = {} }) => {
  const skip = !projectName || !type || !id
  const { data = {}, isFetching } = useGetEntityTooltipQuery(
    { entityType: type, entityId: id, projectName },
    { skip: skip },
  )

  const width = 220

  // check x is not offScreen
  if (left + width / 2 > window.innerWidth) left = window.innerWidth - width / 2

  const { title, subTitle, path, taskType, productType, users = [], thumbnailId, updatedAt } = data

  const { task_types = [], statuses = [] } = projectInfo

  const taskIcon = task_types.find((type) => type.name === taskType)?.icon
  const status = statuses.find((status) => status.name === data.status)
  const thumbnailUrl = getThumbnailUrl({
    entityId: id,
    entityType: type,
    thumbnailId,
    updatedAt,
    projectName,
  })
  const productTypeData = productTypes[productType]
  const productIcon = productTypeData?.icon || 'layers'

  const icons = {
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
      status={status}
      users={users}
      hidePriority
      isLoading={isFetching || skip}
      loadingSections={['header', 'title', 'users', 'status']}
      titleIcon={icons[type]}
      imageUrl={thumbnailUrl}
    />
  )
}

export default EntityTooltip
