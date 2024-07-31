import { FolderListItem } from '@api/rest'
import { PathSegment } from '@components/EntityPath/EntityPath'
import { $Any } from '@types'

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

const getEntityPathData = (entity: $Any, folders: FoldersMap) => {
  const segments: PathSegment[] = []

  //   add parent folders
  let firstParentFolder = folders.get(entity.folderId || '')

  // get all parent folders by looking up the parent id in the folders map
  const allParents = firstParentFolder ? getAllParents(firstParentFolder, folders) : []

  allParents.forEach((folder) => {
    segments.push({ type: 'folder', label: folder.label || folder.name, id: folder.id })
  })

  if (entity.entityType === 'version') {
    // add product
    segments.push({ type: 'product', label: entity.product?.name, id: entity.product?.id })
  }

  if (entity.entityType !== 'folder') {
    // add final entity segment (task, product, version)
    const finalEntitySegment = {
      type: entity.entityType,
      label: entity.label || entity.name,
      id: entity.id,
    }
    segments.push(finalEntitySegment)
  }

  return segments
}

export default getEntityPathData
