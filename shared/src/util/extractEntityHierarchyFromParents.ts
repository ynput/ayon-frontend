// each entity type includes different entities in its parents array
// folders include all parent folders but not the folder itself
// tasks include all parent folders
// products include all parent folders
// versions include all parent folders + product folder
// representations include all parent folders + product folder + version

// we should return consistent data for all entity types
// folderPath - full folder path including itself (if folder)
// task - is there a parent task?
// product - is there a parent product?
// version - is there a parent version?

export const extractEntityHierarchyFromParents = (
  parents: string[],
  entityType: 'folder' | 'task' | 'product' | 'version' | 'representation',
  entityName: string,
): { folderPath: string; taskName?: string; productName?: string; versionName?: string } => {
  let folderPath = ''
  let taskName: string | undefined
  let productName: string | undefined
  let versionName: string | undefined

  switch (entityType) {
    case 'folder':
      folderPath = [...parents, entityName].join('/')
      break
    case 'task':
      folderPath = parents.join('/')
      taskName = entityName
      break
    case 'product':
      folderPath = parents.join('/')
      productName = entityName
      break
    case 'version':
      if (parents.length > 0) {
        folderPath = parents.slice(0, -1).join('/')
        productName = parents[parents.length - 1]
      }
      versionName = entityName
      break
    case 'representation':
      if (parents.length > 1) {
        folderPath = parents.slice(0, -2).join('/')
        productName = parents[parents.length - 2]
        versionName = parents[parents.length - 1]
      }
      break
  }

  return { folderPath, taskName, productName, versionName }
}
