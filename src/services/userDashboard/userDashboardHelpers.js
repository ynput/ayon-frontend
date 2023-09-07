export const transformTasksData = ({ projectName, tasks = [] }) =>
  tasks?.map((task) => {
    const latestVersion = task.versions?.edges[0]?.node
    const thumbnailUrl = latestVersion?.thumbnailId
      ? `/api/projects/${projectName}/thumbnails/${latestVersion?.thumbnailId}?updatedAt=${
          task.updatedAt
        }&token=${localStorage.getItem('accessToken')}`
      : null

    return {
      id: task.id,
      name: task.name,
      status: task.status,
      taskType: task.taskType,
      assignees: task.assignees,
      updatedAt: task.updatedAt,
      folderName: task.folder?.name,
      folderId: task.folderId,
      path: task.folder?.path,
      projectName: projectName,
      latestVersionId: latestVersion?.id,
      latestVersionThumbnailId: latestVersion?.thumbnailId,
      thumbnailUrl,
    }
  })

export const taskProvideTags = (result, type = 'task') =>
  result
    ? [...result.map(({ id }) => ({ type, id })), { type, id: 'TASKS' }]
    : [{ type, id: 'TASKS' }]
