import { PathSegment } from '@components/EntityPath/EntityPath'
import { $Any } from '@types'

const getEntityPathData = (entity: $Any) => {
  const segments: PathSegment[] = []
  //   add parent folders
  segments.push({ type: 'folder', label: entity.folder?.name, id: entity.folder?.id })

  const parentFolders = entity.folder?.path?.split('/').slice(1, -1)
  if (parentFolders?.length > 0) {
    parentFolders.forEach((folder: string) => {
      segments.push({ type: 'folder', label: folder, id: folder })
    })
  }

  if (entity.entityType === 'version') {
    // add product
    segments.push({ type: 'product', label: entity.product.name, id: entity.product.id })
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
