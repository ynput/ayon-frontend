const getVersionThumbnailUrl = (version, projectName, accessToken) => {
  return version?.thumbnailId
    ? `/api/projects/${projectName}/thumbnails/${version?.thumbnailId}?updatedAt=${version.updatedAt}&token=${accessToken}`
    : null
}

export const transformTasksData = ({ projectName, tasks = [], code }) =>
  tasks?.map((task) => {
    const latestVersion = task.versions?.edges[0]?.node

    const accessToken = localStorage.getItem('accessToken')

    const thumbnailUrl = getVersionThumbnailUrl(latestVersion, projectName, accessToken)

    const allVersions =
      task?.allVersions?.edges.map(({ node }) => ({
        ...node,
        thumbnailUrl: getVersionThumbnailUrl(node, projectName, accessToken),
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
      latestVersionThumbnailId: latestVersion?.thumbnailId,
      thumbnailUrl,
      allVersions,
      projectName: projectName,
      projectCode: code,
    }
  })

export const taskProvideTags = (result, type = 'task') =>
  result?.length
    ? [...result.map(({ id }) => ({ type, id })), { type, id: 'TASKS' }]
    : [{ type, id: 'TASKS' }]
