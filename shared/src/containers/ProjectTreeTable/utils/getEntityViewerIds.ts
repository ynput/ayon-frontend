import { EntityMap } from '.'

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
