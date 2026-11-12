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

// the version a selected entity plays on a timeline: a version itself, or a product's featured
// version (products on the versions page carry it)
const getPlayedVersion = (entity: EntityMap): ViewerTargetIds | undefined => {
  if (entity.entityType === 'version') return getEntityViewierIds(entity)
  if (entity.entityType !== 'product' || !('featuredVersion' in entity)) return undefined
  const featured = entity.featuredVersion as { id?: string } | null | undefined
  if (!featured?.id) return undefined
  return { versionId: featured.id, productId: entity.entityId, folderId: entity.folderId }
}

/**
 * The viewer target for several entities, given in table order. With two or more versions among
 * them (or products with a featured version), those versions, which the viewer plays one after
 * another on a timeline. Otherwise the first entity.
 */
export const getEntitiesViewerIds = (entities: EntityMap[]): ViewerTargetIds | undefined => {
  const versions = entities.flatMap((entity) => getPlayedVersion(entity) ?? [])
  if (versions.length < 2) return entities[0] && getEntityViewierIds(entities[0])
  return { ...versions[0], versionIds: versions.flatMap((version) => version.versionId ?? []) }
}
