const versionsToRepresentations = (versions = []) => {
  let representations = []

  for (const version of versions) {
    const product = version.product
    const folder = product?.folder || {}

    for (const representation of version.representations || []) {
      representations.push({
        id: representation.id,
        name: representation.name,
        folderName: folder.name,
        productName: product.name,
        productType: product.productType,
        fileCount: representation.fileCount,
        // for breadcrumbs
        versionName: version.name,
        folderParents: folder.parents,
        projectName: version.projectName,
      })
    }
  }

  return representations
}

export default versionsToRepresentations
