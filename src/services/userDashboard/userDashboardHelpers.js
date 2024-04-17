// NOTE: THIS DOES NOT RUN WHEN PATCHING THE TASKS

import { upperCase, upperFirst } from 'lodash'

export const transformTasksData = ({ projectName, tasks = [], code }) =>
  tasks?.map((task) => {
    const latestVersion = task.versions?.edges[0]?.node

    // use task thumbnail if it exists, otherwise use latest version thumbnail
    const thumbnailId = task?.thumbnailId || latestVersion?.thumbnailId

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
      thumbnailId,
      projectName: projectName,
      projectCode: code,
    }
  })

export const taskProvideTags = (result, type = 'task', entityType = 'task') =>
  result?.length
    ? [
        ...result.map(({ id }) => ({ type, id })),
        { type, id: upperCase(entityType) + 'S' },
        { type: `kanBan${upperFirst(entityType)}`, id: upperCase(entityType) + 'S' },
      ]
    : [{ type, id: upperCase(entityType) + 'S' }]
