const transformVersionsData = (versions) => {
  let rArr = []

  for (const versionEdge of versions) {
    const version = versionEdge.node
    const product = version.product
    const folder = product?.folder

    for (const representationEdge of version.representations?.edges || []) {
      const representation = representationEdge.node
      rArr.push({
        id: representation.id,
        name: representation.name,
        folderName: folder.name,
        productName: product.name,
        productType: product.productType,
        fileCount: representation.fileCount,
        // for breadcrumbs
        versionName: version.name,
        folderParents: folder.parents,
      })
    }
  }

  return rArr
}

export default transformVersionsData
