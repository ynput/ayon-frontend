// NOTE: THIS DOES NOT RUN WHEN PATCHING THE TASKS

import { upperCase, upperFirst } from 'lodash'
import { productTypes } from '/src/features/project'

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
      folder: task.folder,
    }
  })

export const transformEntityData = ({ entity = {}, entityType, projectName, projectInfo = {} }) => {
  // fields that are top level for all entity types
  const sharedFields = ['id', 'tags', 'status', 'updatedAt', 'createdAt', 'thumbnailId', 'attrib']
  const baseDetailsData = sharedFields.reduce((acc, field) => {
    if (entity[field]) {
      acc[field] = entity[field]
    }
    return acc
  }, {})

  baseDetailsData['projectName'] = projectName
  baseDetailsData['entityType'] = entityType

  switch (entityType) {
    case 'task': {
      const path = `${projectName}${entity.folder?.path}/${entity.name}`
      const tasks = projectInfo.task_types || []
      const entitySubType = entity.taskType
      const icon = tasks.find((task) => task.name === entitySubType)?.icon
      return {
        ...baseDetailsData,
        title: entity?.folder?.label || entity?.folder?.name || 'Unknown Folder',
        subTitle: entity.label || entity.name,
        users: entity.assignees,
        path: path,
        folderId: entity.folderId,
        icon: icon,
        entitySubType: entitySubType,
      }
    }
    case 'version': {
      const path = `${projectName}${entity.product?.folder?.path}/${entity.product?.name}/${entity.name}`
      const entitySubType = entity.product?.productType
      const icon = productTypes[entitySubType]?.icon

      return {
        ...baseDetailsData,
        title: entity?.product?.name || 'Unknown Product',
        subTitle: entity.name || entity.version,
        users: entity.author ? [entity.author] : [],
        path: path,
        folderId: entity.product?.folder?.id,
        productId: entity.product?.id,
        icon: icon || 'layers',
        entitySubType: entitySubType,
      }
    }
    case 'folder': {
      const path = `${projectName}${entity.path}`
      const folders = projectInfo.folder_types || []
      const entitySubType = entity.folderType
      const icon = folders.find((folder) => folder.name === entitySubType)?.icon
      return {
        ...baseDetailsData,
        title: entity.label || entity.name || 'Unknown Folder',
        subTitle: path.split('/').slice(-2)[0],
        users: [],
        path: path,
        folderId: entity.id,
        icon: icon || 'folder',
        entitySubType: entitySubType,
      }
    }
    default:
      return baseDetailsData
  }
}

export const taskProvideTags = (result, type = 'task', entityType = 'task') =>
  result?.length
    ? [
        ...result.map(({ id }) => ({ type, id })),
        { type, id: upperCase(entityType) + 'S' },
        { type: `kanBan${upperFirst(entityType)}`, id: upperCase(entityType) + 'S' },
      ]
    : [{ type, id: upperCase(entityType) + 'S' }]
