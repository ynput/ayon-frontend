import { DetailsPanelEntityType } from '@shared/api'
import { EntityTypeIcons, EntityTypeColors } from '../DetailsPanelHeader/DetailsPanelHeader'
import { getEntityTypeIcon } from '@shared/util'

type Entity = {
  id: string
  projectName: string
  folder?: {
    folderType: string
  }
  task?: {
    taskType: string
  }
  product?: {
    productType: string
  }
  updatedAt: string
}

const getThumbnails = (
  entities: Entity[],
  entityType: DetailsPanelEntityType,
  icons: EntityTypeIcons,
) => {
  if (!entities[0]) return []

  if (entityType === 'representation') return [{ icon: 'view_in_ar' }]

  const getIcon = (entity: Entity) => {
    switch (entityType) {
      case 'folder':
        return entity.folder?.folderType
          ? icons.folder[entity.folder.folderType]
          : getEntityTypeIcon('folder')
      case 'task':
        return entity.task?.taskType ? icons.task[entity.task.taskType] : getEntityTypeIcon('task')
      case 'version':
        return entity.product?.productType
          ? icons.product[entity.product.productType]
          : getEntityTypeIcon('version')

      default:
        break
    }
  }

  return entities.slice(0, 6).map((entity) => ({
    icon: getIcon(entity),
    id: entity.id,
    type: entityType,
    updatedAt: entity.updatedAt,
    projectName: entity.projectName,
  }))
}

export default getThumbnails
