const getThumbnailUrl = (thumbnailId, updatedAt, projectName, accessToken) => {
  return thumbnailId
    ? `/api/projects/${projectName}/thumbnails/${thumbnailId}?updatedAt=${updatedAt}&token=${accessToken}`
    : null
}

export const transformTasksData = ({ projectName, tasks = [], code }) =>
  tasks?.map((task) => {
    const latestVersion = task.versions?.edges[0]?.node

    const accessToken = localStorage.getItem('accessToken')

    // use task thumbnail if it exists, otherwise use latest version thumbnail
    const thumbnailId = task?.thumbnailId || latestVersion?.thumbnailId
    const updatedAt = task?.thumbnailId ? task?.updatedAt : latestVersion?.updatedAt
    const thumbnailUrl = getThumbnailUrl(thumbnailId, updatedAt, projectName, accessToken)

    const allVersions =
      task?.allVersions?.edges.map(({ node }) => ({
        ...node,
        thumbnailUrl: getThumbnailUrl(node, projectName, accessToken),
      })) || []

    // create a short path [code][.../][end of path by depth joined by /][taskName]
    const depth = 2
    const path = task.folder?.path?.split('/')
    const pathLastItems = path?.slice(-depth)
    const pathPrefix = path?.length > depth ? '../' : '/'
    const shortPath = `${code}${pathPrefix}${pathLastItems?.join('/')}/${task.name}`

    return {
      id: task.id,
      name: task.name,
      status: task.status,
      taskType: task.taskType,
      assignees: task.assignees,
      updatedAt: task.updatedAt,
      endDate: task.attrib?.endDate,
      folderName: task.folder?.name,
      folderId: task.folderId,
      path: `${projectName}/${task.folder?.path}`,
      shortPath,
      latestVersionId: latestVersion?.id,
      thumbnailUrl,
      allVersions,
      projectName: projectName,
      projectCode: code,
    }
  })

export const taskProvideTags = (result, type = 'task') =>
  result?.length
    ? [
        ...result.map(({ id }) => ({ type, id })),
        { type, id: 'TASKS' },
        { type: 'kanBanTask', id: 'TASKS' },
      ]
    : [{ type, id: 'TASKS' }]
