// NOTE: THIS DOES NOT RUN WHEN PATCHING THE TASKS

export const transformTasksData = ({ projectName, tasks = [], code }) =>
  tasks?.map((task) => {
    const latestVersion = task.versions?.edges[0]?.node

    // use task thumbnail if it exists, otherwise use latest version thumbnail
    const thumbnailId = task?.thumbnailId || latestVersion?.thumbnailId

    const allVersions = task?.allVersions?.edges.map(({ node }) => node) || []

    // create a short path [code][.../][end of path by depth joined by /][taskName]
    const depth = 2
    const path = task.folder?.path?.replace(/^\/+|\/+$/g, '').split('/')
    const pathLastItems = path?.slice(-depth)
    const pathPrefix = path?.length > depth ? '/.../' : '/'
    const shortPath = `${code}${pathPrefix}${pathLastItems?.join('/')}/${task.name}`

    return {
      id: task.id,
      name: task.name,
      label: task.label,
      status: task.status,
      taskType: task.taskType,
      assignees: task.assignees,
      updatedAt: task.updatedAt,
      endDate: task.attrib?.endDate,
      folderName: task.folder?.name,
      folderLabel: task.folder?.label,
      folderId: task.folderId,
      path: `${projectName}${task.folder?.path}`,
      shortPath,
      latestVersionId: latestVersion?.id,
      latestVersionThumbnailId: latestVersion?.thumbnailId,
      latestVersionUpdatedAt: latestVersion?.updatedAt,
      thumbnailId,
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
