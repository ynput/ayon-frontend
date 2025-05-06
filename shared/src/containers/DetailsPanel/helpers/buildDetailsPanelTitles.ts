import { DetailsPanelEntityData, DetailsPanelEntityType } from '@shared/api'

type TitleResult = { title: string; subTitle: string }

/**
 * Builds appropriate title and subtitle for entity details panel
 * based on entity type and data
 */
export const buildDetailsPanelTitles = (
  entities: DetailsPanelEntityData[],
  entityType?: DetailsPanelEntityType,
): TitleResult => {
  const isMultiple = entities.length > 1
  const firstEntity = entities[0]

  // Handle multiple entities case
  if (isMultiple) {
    return {
      title: `${entities.length} ${entityType}s`,
      subTitle: entities.map((t) => t.name).join(', '),
    }
  }

  // Handle single entity case
  if (!firstEntity) return { title: 'loading...', subTitle: 'loading...' }

  switch (entityType) {
    case 'folder':
      return {
        title: firstEntity.label || firstEntity.name || 'Unknown Folder',
        subTitle: firstEntity.folder?.folderType || 'Folder',
      }
    case 'task':
      return {
        title: firstEntity.folder?.label || firstEntity.folder?.name || 'Unknown Folder',
        subTitle: firstEntity.label || firstEntity.name,
      }
    case 'version':
      return {
        title: firstEntity.product?.name || 'Unknown Product',
        subTitle: firstEntity.name || 'Unknown Version',
      }
    case 'representation':
      return {
        title: firstEntity.version?.name || 'Unknown Version',
        subTitle: firstEntity.name || 'Unknown Representation',
      }
    default:
      return {
        title: firstEntity.name || 'Unknown Entity',
        subTitle: firstEntity.entityType || 'Unknown Type',
      }
  }
}
