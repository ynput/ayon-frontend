// add shortPath (description)
// add icons
// add thumbnailUrl

import type { GetKanbanResponse, KanbanNode, Status, TaskType, EnumItem } from '@shared/api'
import { $Any } from '@/types'
import { getEntityThumbnailUrl } from '@shared/util'

type ProjectsInfo = {
  [key: string]: $Any
}

type ExtraInfo = {
  taskInfo: TaskType
  statusInfo: Status
  priorityInfo: EnumItem | undefined
}

export interface TransformedKanbanTask extends KanbanNode, ExtraInfo {
  thumbnailUrl: string | null
  parentFolder: string
}

const transformKanbanTasks = (
  tasks: GetKanbanResponse,
  {
    projectsInfo,
    priorities,
    isLoadingTasks,
  }: { projectsInfo: ProjectsInfo; priorities: EnumItem[]; isLoadingTasks: boolean },
): TransformedKanbanTask[] => {
  // if is loading return an empty array
  if (isLoadingTasks) return []

  return tasks.map((task) => {
    const projectInfo = projectsInfo[task.projectName]

    const taskInfo: TaskType = projectInfo?.taskTypes?.find(
      (type: $Any) => type.name === task.taskType,
    )

    const statusInfo: Status = projectInfo?.statuses?.find(
      (statusItem: $Any) => statusItem.name === task.status,
    )

    const priorityInfo: EnumItem | undefined = priorities.find(
      // TODO: fix this when real data is available
      (priorityItem) => priorityItem.value === task.priority,
    )

    const pathParts = task.folderPath?.split('/').filter(Boolean) || []
    const parentFolder = pathParts.length >= 2 ? pathParts[pathParts.length - 2] : 'Root'

    return {
      ...task,
      thumbnailUrl: getEntityThumbnailUrl({
        projectName: task.projectName,
        entityType: 'task',
        entityId: task.id,
        thumbnailHash: task.thumbnailHash,
      }),
      statusInfo,
      taskInfo,
      priorityInfo,
      parentFolder,
    }
  })
}

export default transformKanbanTasks
