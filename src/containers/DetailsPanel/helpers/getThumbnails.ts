type Entity = {
  id: string
  icon: string
  updatedAt: string
}

const getThumbnails = (entities: Entity[], entityType: string) => {
  if (!entities[0]) return []

  if (entityType === 'representation') return [{ icon: 'view_in_ar' }]

  return entities.slice(0, 6).map((entity) => ({
    icon: entity.icon,
    id: entity.id,
    type: entityType,
    updatedAt: entity.updatedAt,
  }))
}

export default getThumbnails
