import { FolderListItem } from '@api/rest'
import { PathSegment } from '@components/EntityPath/EntityPath'
import { $Any } from '@types'

type FoldersMap = Map<string, FolderListItem>

const getAllParents = (
  firstParentFolder: FolderListItem,
  folders: FoldersMap,
): FolderListItem[] => {
  const parents: FolderListItem[] = []
  let currentFolder = firstParentFolder

  while (currentFolder.parentId && currentFolder.parentId !== 'root') {
    const parentFolder = folders.get(currentFolder.parentId)
    if (!parentFolder) {
      break
    }
    parents.push(parentFolder)
    currentFolder = parentFolder
  }

  return parents
}

const getEntityPathData = (entity: $Any, folders: FoldersMap) => {
  const segments: PathSegment[] = []

  //   add parent folders
  let firstParentFolder = folders.get(entity.folderId || '')

  // if entityType folder, skip the first parent folder because it's already added in final entity segment
  // if (entity.entityType === 'folder')
  //   firstParentFolder = folders.get(firstParentFolder?.parentId || '')

  // get all parent folders by looking up the parent id in the folders map
  const allParents = firstParentFolder ? getAllParents(firstParentFolder, folders) : []

  allParents.forEach((folder) => {
    segments.push({ type: 'folder', label: folder.label || folder.name, id: folder.id })
  })

  if (entity.entityType === 'version') {
    // add product
    segments.push({ type: 'product', label: entity.product?.name, id: entity.product?.id })
  }

  // add final entity segment (folder, task, product, version)
  const finalEntitySegment = {
    type: entity.entityType,
    label: entity.label || entity.name,
    id: entity.id,
  }
  segments.push(finalEntitySegment)

  if (entity.entityType === 'version') {
  }

  return segments
}

export default getEntityPathData
