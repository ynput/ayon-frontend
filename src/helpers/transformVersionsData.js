const transformVersionsData = (versions) => {
  let rArr = []

  for (const versionEdge of versions) {
    console.log(versionEdge)
    const version = versionEdge.node
    const subset = version.subset
    const folder = subset.folder

    for (const representationEdge of version.representations.edges) {
      const representation = representationEdge.node
      rArr.push({
        id: representation.id,
        name: representation.name,
        folderName: folder.name,
        subsetName: subset.name,
        family: subset.family,
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
