export const entityTypesWithIcons = [
  'task',
  'workfile',
  'folder',
  'product',
  'version',
  'representation',
]
export const getEntityTypeIcon = (type: string, fallback?: string) => {
  let typeIcon
  switch (type) {
    case 'task':
      typeIcon = 'check_circle'
      break
    case 'workfile':
      typeIcon = 'home_repair_service'
      break
    case 'folder':
      typeIcon = 'folder'
      break
    case 'product':
      typeIcon = 'inventory_2'
      break
    case 'version':
      typeIcon = 'layers'
      break
    case 'representation':
      typeIcon = 'view_in_ar'
      break
    default:
      typeIcon = fallback || 'web_asset'
  }

  return typeIcon
}
