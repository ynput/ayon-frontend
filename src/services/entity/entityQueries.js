export const TASK_QUERY = `
  query Tasks($projectName: String!, $ids: [String!]!) {
      project(name: $projectName) {
          tasks(ids: $ids) {
              edges {
                  node {
                      id
                      name
                      label
                      status
                      tags
                      taskType
                      assignees
                      updatedAt
                      attrib {
                        #ATTRS#
                      }
                  }
              }
          }
      }
  }
`

export const FOLDER_QUERY = `
    query Folders($projectName: String!, $ids: [String!]!) {
        project(name: $projectName) {
            folders(ids: $ids) {
                edges {
                    node {
                        id
                        name
                        label
                        folderType
                        path
                        status
                        tags
                        updatedAt
                        attrib {
                          #ATTRS#
                        }
                    }
                }
            }
        }
    }

`

export const VERSION_QUERY = `
    query Versions($projectName: String!, $ids: [String!]!) {
        project(name: $projectName) {
            versions(ids: $ids) {
                edges {
                    node {
                        id
                        version
                        name
                        author
                        status
                        tags
                        updatedAt
                        attrib {
                          #ATTRS#
                        }
                        product {
                            id
                            name
                            productType
                            folder {
                                name
                                parents
                            }
                        }
                        representations{
                            edges {
                                node {
                                    id
                                    name
                                    fileCount
                                }
                            }
                        }
                    }
                }
            }
        }
    }
`

export const REP_QUERY = `
    query Representations($projectName: String!, $ids: [String!]!) {
      project(name: $projectName) {
        representations(ids: $ids) {
          edges {
            node {
              id
              versionId
              name
              status
              tags
              updatedAt
              attrib {
                #ATTRS#
              }
              version {
                name
              }
            }
          }
        }
      }
    }
`

export const PRODUCT_QUERY = `
query Product($projectName: String!, $ids: [String!]!, $versionOverrides: [String!]!) {
    project(name: $projectName){
        products(ids: $ids){
            edges {
                node {
                    id
                    name
                    productType
                    status
                    createdAt
                    updatedAt
                    versionList{
                      id
                      version
                      name
                    }
                    attrib {
                      #ATTRS#
                    }
                    versions(ids: $versionOverrides){
                      edges{
                        node{
                          id
                          version
                          name
                          author
                          createdAt
                          taskId
                          attrib {
                              fps
                              resolutionWidth
                              resolutionHeight
                              frameStart
                              frameEnd
                          }
                        }
                      }
                    }

                    latestVersion{
                        id
                        version
                        name
                        author
                        createdAt
                        taskId
                        attrib {
                            fps
                            resolutionWidth
                            resolutionHeight
                            frameStart
                            frameEnd
                        }
                    }
                }
            }
        }
    }
}
`

export const TASK_TILE_FRAGMENT = `
fragment taskTileFragment on TaskNode {
  id
  name
  status
  icon: taskType
  thumbnailEntityId: id
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
  thumbnailEntityId: latestVersion {
    id
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
  footer: folderType
  updatedAt
  path: parent {
    path
  }
}`
