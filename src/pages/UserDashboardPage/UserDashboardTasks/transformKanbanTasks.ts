// add shortPath (description)
// add icons
// add thumbnailUrl

import { KanbanNode } from '@/api/graphql'
import { GetKanbanResponse } from '@queries/userDashboard/getUserDashboard'
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
      thumbnailUrl: `/api/projects/${task.projectName}/tasks/${task.id}/thumbnail?updatedAt=${task.updatedAt}&placeholder=none`,
      ...icons,
    }
  })
}

export default transformKanbanTasks
