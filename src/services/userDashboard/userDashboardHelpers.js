// NOTE: THIS DOES NOT RUN WHEN PATCHING THE TASKS

import { isEmpty, upperCase, upperFirst } from 'lodash'
import { productTypes } from '@state/project'
import getEntityTypeIcon from '@helpers/getEntityTypeIcon'

export const transformTasksData = ({ projectName, tasks = [], code }) =>
  tasks?.map((task) => {
    const versions = task.versions?.edges?.map((edge) => edge.node) || []
    // get latest version with thumbnail
    // if there is a version named 'HERO' with a thumbnail, use that always
    const latestVersionWithThumbnail =
      versions.find((version) => version.name === 'HERO' && version.thumbnailId) ||
      [...versions]
        .sort((a, b) => a.name.localeCompare(b.name))
        .reverse()
        .find((version) => version.thumbnailId)

    // use task thumbnail if it exists, otherwise use latest version thumbnail
    const thumbnailId = task?.thumbnailId || latestVersionWithThumbnail?.thumbnailId
    // we prefer using the entity id and entity type for the thumbnail endpoint
    // normal users can not see thumbnails from thumbnailId
    const thumbnailEntityId = task?.thumbnailId ? task.id : latestVersionWithThumbnail?.id
    const thumbnailEntityType = task?.thumbnailId ? 'task' : 'version'
    const thumbnailUpdatedAt = task?.thumbnailId
      ? task.updatedAt
      : latestVersionWithThumbnail?.updatedAt

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
      thumbnailEntityId,
      thumbnailEntityType,
      thumbnailUpdatedAt,
      projectName: projectName,
      projectCode: code,
      folder: task.folder,
    }
  })

export const transformEntityData = ({ entity = {}, entityType, projectName, projectInfo = {} }) => {
  // fields that are top level for all entity types
  const sharedFields = [
    'id',
    'tags',
    'status',
    'updatedAt',
    'createdAt',
    'thumbnailId',
    'attrib',
    'hasReviewables',
  ]
  const baseDetailsData = sharedFields.reduce((acc, field) => {
    if (entity[field]) {
      acc[field] = entity[field]
    }
    return acc
  }, {})

  if (isEmpty(entity)) return null

  baseDetailsData['projectName'] = projectName
  baseDetailsData['entityType'] = entityType
  baseDetailsData['label'] = entity.label
  baseDetailsData['name'] = entity.name

  switch (entityType) {
    case 'task': {
      const path = `${projectName}${entity.folder?.path}/${entity.name}`
      const tasks = projectInfo.task_types || []
      const entitySubType = entity.taskType
      const icon = tasks.find((task) => task.name === entitySubType)?.icon
      const latestVersion = entity.versions?.edges?.map((edge) => edge.node)?.[0]
      const versionId = latestVersion?.id
      const productId = latestVersion?.productId

      return {
        ...baseDetailsData,
        title: entity?.folder?.label || entity?.folder?.name || 'Unknown Folder',
        subTitle: entity.label || entity.name,
        users: entity.assignees,
        path: path,
        folderId: entity.folderId,
        folder: entity.folder,
        icon: icon || getEntityTypeIcon('task'),
        entitySubType: entitySubType,
        versionId: versionId,
        productId: productId,
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
        icon: icon || getEntityTypeIcon('version'),
        entitySubType: entitySubType,
        representations: entity.representations?.edges?.map((edge) => edge.node) || [],
        folder: entity.product?.folder,
        product: entity.product,
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
        icon: icon || getEntityTypeIcon('folder'),
        entitySubType: entitySubType,
      }
    }
    case 'representation': {
      let context = {}

      try {
        context = JSON.parse(entity.context)
      } catch (error) {
        console.error(error)
      }

      const { path: folderPath, product = {} } = context

      const path = `${projectName}/${folderPath}/${product.name}/${entity.version?.name}/${entity.name}`

      return {
        ...baseDetailsData,
        title: entity.version?.name || 'Unknown Version',
        subTitle: entity.name || 'Unknown Representation',
        users: entity.version?.author ? [entity.version?.author] : [],
        path: path,
        folderId: entity.product?.folder?.id,
        productId: entity.product?.id,
        icon: getEntityTypeIcon('representation'),
        entitySubType: 'representation',
        folder: entity.product?.folder,
        product: entity.product,
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

export const getEntityDetailsData = ({
  entities,
  entityType,
  projectsInfo,
  detailsData,
  isSuccess,
  isError,
}) => {
  if (isSuccess && !isError && detailsData.length > 0) {
    return detailsData
  }

  if (entities.length) {
    return entities.map(({ id }) => ({ id }))
  }

  return entities.map((entity) =>
    transformEntityData({
      entity,
      entityType,
      projectName: entity.projectName,
      projectInfo: projectsInfo[entity.projectName],
    }),
  )
}
