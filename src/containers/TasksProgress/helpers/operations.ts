import { ProgressTask } from '@queries/tasksProgress/getTasksProgress'
import { Operation } from '../TasksProgress'

export const getStatusChangeOperations = (
  tasks: ProgressTask[],
  projectName: string,
  status: string,
) => {
  const operations: Operation[] = tasks.map((task) => ({
    id: task.id,
    projectName,
    data: { status },
    meta: { folderId: task.folder.id },
  }))

  return operations
}

export const getAssigneesChangeOperations = (
  tasks: ProgressTask[],
  projectName: string,
  added: string[],
  removed: string[],
) => {
  const operations: Operation[] = tasks.map((task) => {
    let newAssignees = added
    if (tasks.length > 1) {
      newAssignees = task.assignees.filter((id) => !removed.includes(id)).concat(added)
    }

    // unique assignees
    newAssignees = Array.from(new Set(newAssignees))

    return {
      id: task.id,
      projectName,
      data: { assignees: newAssignees },
      meta: { folderId: task.folder.id },
    }
  })

  return operations
}

export const getPriorityChangeOperations = (
  tasks: ProgressTask[],
  projectName: string,
  priority: string,
) => {
  const operations: Operation[] = tasks.map((task) => ({
    id: task.id,
    projectName,
    data: { attrib: { priority } },
    meta: { folderId: task.folder.id },
  }))

  return operations
}
