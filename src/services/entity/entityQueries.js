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
                        subset {
                            name
                            family
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

export const SUBSET_QUERY = `
query Subset($projectName: String!, $ids: [String!]!, $versionOverrides: [String!]!) {
    project(name: $projectName){
        subsets(ids: $ids){
            edges {
                node {
                    id
                    name
                    family
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
  thumbnailEntityId: folder {
    id
  }
  subTitle: folder {
    name
  }
  profile: assignees
  footer: folder {
    folderType
  }
  updatedAt
}
`
export const VERSION_TILE_FRAGMENT = `
fragment versionTileFragment on VersionNode {
  id
  name: subset {
    name
  }
  status
  icon: subset {
    family
  }
  thumbnailEntityId: id
  subTitle: version
  profile: author
  footer: subset {
    family
  }
  updatedAt
}
`

export const SUBSET_TILE_FRAGMENT = `
fragment subsetTileFragment on SubsetNode {
  id
  name
  status
  icon: family
  thumbnailEntityId: latestVersion {
    id
  }
  subTitle: folder {
    name
  }
  footer: family
  updatedAt
}
`

export const FOLDER_TILE_FRAGMENT = `
fragment folderTileFragment on FolderNode {
  id
  name
  status
  icon: folderType
  thumbnailEntityId: id
  subTitle: path
  footer: folderType
  updatedAt
}`
