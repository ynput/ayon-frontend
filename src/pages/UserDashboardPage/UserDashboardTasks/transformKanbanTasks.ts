// add shortPath (description)
// add icons
// add thumbnailUrl

import { KanbanNode } from '@/api/graphql'
import { GetKanbanResponse } from '@/services/userDashboard/getUserDashboardTest'
import { $Any } from '@/types'

const getDescriptionPath = ({
  folderPath,
  name,
  projectCode,
}: {
  folderPath: string
  name: string
  projectCode: string
}) => {
  const depth = 2
  const path = folderPath.replace(/^\/+|\/+$/g, '').split('/')
  const pathLastItems = path?.slice(-depth)
  const pathPrefix = path?.length > depth ? '/.../' : '/'
  const shortPath = `${projectCode}${pathPrefix}${pathLastItems?.join('/')}/${name}`
  return shortPath
}

type ThumbnailUrlParams = Pick<
  KanbanNode,
  'id' | 'updatedAt' | 'lastVersionWithThumbnailId' | 'projectName'
>

// get the thumbnail url for a task
const getTaskThumbnailUrl = (
  { id, updatedAt, lastVersionWithThumbnailId, projectName }: ThumbnailUrlParams,
  taskHasThumbnail: boolean,
) => {
  //    are we using task thumbnail or last version with thumbnail
  const entityType = taskHasThumbnail ? 'tasks' : 'versions'
  const entityId = taskHasThumbnail ? id : lastVersionWithThumbnailId

  if (!entityId) return null

  const baseUrl = `/api/projects/${projectName}/${entityType}/${entityId}/thumbnail`
  // add updatedAt as a query parameter to force refresh the thumbnail
  return `${baseUrl}?updatedAt=${updatedAt}`
}

type TaskIconsParams = Pick<KanbanNode, 'status' | 'taskType'>
type TaskIcons = {
  taskIcon: string
  statusIcon: string
  statusColor: string
}
// Function to get the task icon, the status icon and statusColor
const getTaskIcons = (
  { status, taskType }: TaskIconsParams,
  projectInfo: ProjectsInfo[0],
): TaskIcons => {
  // Initialize the icons object with default values
  const icons: TaskIcons = {
    taskIcon: '',
    statusIcon: '',
    statusColor: '',
  }

  // Find the matching status in the project info
  const findStatus = projectInfo?.statuses?.find((statusItem: $Any) => statusItem.name === status)
  if (findStatus) {
    icons.statusIcon = findStatus.icon
    icons.statusColor = findStatus.color
  }

  // Find the matching task type in the project info
  const findTaskIcon = projectInfo?.task_types?.find((type: $Any) => type.name === taskType)
  if (findTaskIcon) {
    icons.taskIcon = findTaskIcon.icon
  }

  return icons
}

type ProjectsInfo = {
  [key: string]: $Any
}

export interface TransformedKanbanTask extends KanbanNode, TaskIcons {
  shortPath: string // used for the description
  thumbnailUrl: string | null
}

const transformKanbanTasks = (
  tasks: GetKanbanResponse,
  projectsInfo: ProjectsInfo,
  isLoadingTasks: boolean,
): TransformedKanbanTask[] => {
  // if is loading return an empty array
  if (isLoadingTasks) return []

  return tasks.map((task) => {
    const projectInfo = projectsInfo[task.projectName]
    const code = projectInfo?.code
    // create a short path [code][.../][end of path by depth joined by /][taskName]
    const shortPath = getDescriptionPath({
      folderPath: task.folderPath,
      name: task.name,
      projectCode: task.projectCode,
    })

    const thumbnailUrl = getTaskThumbnailUrl(
      {
        id: task.id,
        updatedAt: task.updatedAt,
        lastVersionWithThumbnailId: task.lastVersionWithThumbnailId,
        projectName: task.projectName,
      },
      !!task.thumbnailId,
    )

    const icons = getTaskIcons(
      {
        status: task.status,
        taskType: task.taskType,
      },
      projectInfo,
    )

    return {
      ...task,
      projectCode: code,
      shortPath,
      thumbnailUrl,
      ...icons,
    }
  })
}

export default transformKanbanTasks
