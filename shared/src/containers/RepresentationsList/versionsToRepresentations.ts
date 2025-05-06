import type { DetailsPanelEntityData } from '@shared/api'

const versionsToRepresentations = (entities: DetailsPanelEntityData[] = []) => {
  let representations = []

  for (const entity of entities) {
    const product = entity?.product
    const folder = entity?.folder

    for (const representation of entity.representations || []) {
      representations.push({
        id: representation.id,
        name: representation.name,
        folderName: folder?.name,
        productName: product?.name,
        productType: product?.productType,
        fileCount: representation.fileCount,
        projectName: entity.projectName,
      })
    }
  }

  return representations
}

export default versionsToRepresentations
