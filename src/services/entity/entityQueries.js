export const TASK_TILE_FRAGMENT = `
fragment taskTileFragment on TaskNode {
  id
  name
  status
  icon: taskType
  thumbnailEntityId: id
  thumbnailId
  profile: assignees
  footer: folder {
    folderType
  }
  updatedAt
  path: folder {
    path
  }
}
`
export const VERSION_TILE_FRAGMENT = `
fragment versionTileFragment on VersionNode {
  id
  name: product {
    name
  }
  status
  icon: product {
    productType
  }
  thumbnailEntityId: id
  thumbnailId
  profile: author
  footer: product {
    productType
  }
  updatedAt
  path: product {
    path:folder {
      path
    }
  }
  version
}
`

export const PRODUCT_TILE_FRAGMENT = `
fragment productTileFragment on ProductNode {
  id
  name
  status
  icon: productType
  latestVersion {
    id
    thumbnailId
  }
  footer: productType
  updatedAt
  path:folder {
    path
  }
}
`

export const FOLDER_TILE_FRAGMENT = `
fragment folderTileFragment on FolderNode {
  id
  name
  status
  icon: folderType
  thumbnailEntityId: id
  thumbnailId
  footer: folderType
  updatedAt
  path: parent {
    path
  }
}`
