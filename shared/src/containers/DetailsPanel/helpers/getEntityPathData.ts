import { PathSegment } from '@shared/components'
import { DetailsPanelEntityData } from '@shared/api'
import { FolderListItem } from '@shared/api'

type FoldersMap = Map<string, FolderListItem>

const getAllParents = (
  firstParentFolder: FolderListItem,
  folders: FoldersMap,
): FolderListItem[] => {
  const parents: FolderListItem[] = [firstParentFolder]
  let currentFolder = firstParentFolder

  while (currentFolder.parentId && currentFolder.parentId !== 'root') {
    const parentFolder = folders.get(currentFolder.parentId)
    if (!parentFolder) {
      break
    }
    parents.unshift(parentFolder)
    currentFolder = parentFolder
  }

  return parents
}

const getEntityPathData = (entity: DetailsPanelEntityData, folders: FoldersMap) => {
  const segments: PathSegment[] = []

  //   add parent folders
  let firstParentFolder = folders.get(entity.folder?.id || '')

  // get all parent folders by looking up the parent id in the folders map
  const allParents = firstParentFolder ? getAllParents(firstParentFolder, folders) : []

  allParents.forEach((folder) => {
    segments.push({ type: 'folder', label: folder.label || folder.name, id: folder.id })
  })

  if (entity.entityType === 'version') {
    // linked task sits between the folder hierarchy and the product/version
    if (entity.task?.id) {
      segments.push({
        type: 'task',
        label: entity.task.label || entity.task.name,
        id: entity.task.id,
      })
    }
    const productVersion = `${entity.product?.name} - ${entity.name}`
    // add product - version
    segments.push({ type: 'version', label: productVersion, id: entity.id })
  }
  if (entity.entityType === 'task') {
    // add task
    segments.push({ type: 'task', label: entity.label || entity.name, id: entity.id })
  }

  return segments
}

export default getEntityPathData
