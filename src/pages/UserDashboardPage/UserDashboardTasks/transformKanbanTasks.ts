// add shortPath (description)
// add icons
// add thumbnailUrl

import { KanbanNode } from '@/api/graphql'
import { GetKanbanResponse } from '@queries/userDashboard/getUserDashboard'
import { $Any } from '@/types'
import { Status, TaskType } from '@api/rest'

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

type ProjectsInfo = {
  [key: string]: $Any
}

type ExtraInfo = {
  taskInfo: TaskType
  statusInfo: Status
}

export interface TransformedKanbanTask extends KanbanNode, ExtraInfo {
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

    const taskInfo: TaskType = projectInfo?.task_types?.find(
      (type: $Any) => type.name === task.taskType,
    )

    const statusInfo: Status = projectInfo?.statuses?.find(
      (statusItem: $Any) => statusItem.name === task.status,
    )

    return {
      ...task,
      projectCode: code,
      shortPath,
      thumbnailUrl: `/api/projects/${task.projectName}/tasks/${task.id}/thumbnail?updatedAt=${task.updatedAt}`,
      statusInfo,
      taskInfo,
    }
  })
}

export default transformKanbanTasks
