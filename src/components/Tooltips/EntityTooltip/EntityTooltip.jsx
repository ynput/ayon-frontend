import * as Styled from './EntityTooltip.styled'
import { productTypes } from '/src/features/project'
import { getThumbnailUrl } from '/src/pages/UserDashboardPage/UserDashboardTasks/UserTasksContainer'
import { useGetEntityTooltipQuery } from '/src/services/activities/getActivities'

const EntityTooltip = ({ type, id, pos, projectName, projectInfo = {} }) => {
  const skip = !projectName || !type || !id
  const { data = {}, isFetching } = useGetEntityTooltipQuery(
    { entityType: type, entityId: id, projectName },
    { skip: skip },
  )

  const { title, subTitle, path, taskType, productType, users = [], thumbnailId, updatedAt } = data

  const { task_types = [], statuses = [] } = projectInfo

  const taskIcon = task_types.find((type) => type.name === taskType)?.icon
  const status = statuses.find((status) => status.name === data.status)
  const thumbnailUrl = getThumbnailUrl(id, thumbnailId, updatedAt, projectName)
  const productTypeData = productTypes[productType]
  const productIcon = productTypeData?.icon || 'layers'

  const icons = {
    task: taskIcon,
    version: productIcon,
  }

  return (
    <Styled.TooltipEntityCard
      style={{ ...pos }}
      {...{ title, subTitle }}
      description={projectName + path}
      isLoading={isFetching || skip}
      assignees={users}
      titleIcon={icons[type]}
      icon={status?.icon}
      iconColor={status?.color}
      imageUrl={thumbnailUrl}
    />
  )
}

export default EntityTooltip
