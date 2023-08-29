export const transformTasksData = ({ projectName, tasks }) =>
  tasks.map((task) => {
    return {
      id: task.id,
      name: task.name,
      status: task.status,
      taskType: task.taskType,
      assignees: task.assignees,
      folderName: task.folder?.name,
      folderId: task.folderId,
      path: task.folder?.path,
      projectName: projectName,
    }
  })

export const taskProvideTags = (result, type = 'task') =>
  result
    ? [...result.map(({ id }) => ({ type, id })), { type, id: 'TASKS' }]
    : [{ type, id: 'TASKS' }]
