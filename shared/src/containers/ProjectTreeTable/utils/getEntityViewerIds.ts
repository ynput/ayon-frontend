import type { EntityMap } from '../types/table'

// gets parents id of an entity when using the viewer
export const getEntityViewierIds = (entity: EntityMap): { [id: string]: string } => {
  const targetIds = {
    [entity.entityType + 'Id']: entity.entityId,
  }
  // if version, also include productId and folderId
  if (entity.entityType === 'version') {
    if ('product' in entity && entity.product?.id) {
      targetIds.productId = entity.product?.id
      if ('folder' in entity.product && entity.product?.folder?.id) {
        targetIds.folderId = entity.product?.folder.id
      }
    }
  }
  return targetIds
}

export type ViewerTargetIds = {
  taskId?: string
  folderId?: string
  productId?: string
  versionId?: string
  // several versions, played one after another on the viewer's timeline
  versionIds?: string[]
}

/**
 * The viewer target for several entities, given in table order. With two or more versions among
 * them, those versions, which the viewer plays one after another on a timeline. Otherwise the
 * first entity.
 */
export const getEntitiesViewerIds = (entities: EntityMap[]): ViewerTargetIds | undefined => {
  const versions = entities.filter((entity) => entity.entityType === 'version')
  if (versions.length < 2) return entities[0] && getEntityViewierIds(entities[0])
  const first: ViewerTargetIds = getEntityViewierIds(versions[0])
  return { ...first, versionIds: versions.map((version) => version.entityId) }
}
