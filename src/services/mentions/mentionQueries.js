const VERSION_FRAGMENT = `
fragment VersionFragment on VersionNode {
  id
  name
  productId
  author
  createdAt
  author
  version
  product {
    name
    productType
  }
}
`

// type can be task or product
export const ENTITY_MENTION_VERSIONS = (type = 'task') => `
query getMentionVersions($projectName: String!, $entityIds: [String!]) {
  project(name: $projectName) {
    versions(${type}Ids: $entityIds) {
      edges {
        node{
          ...VersionFragment
        }
      }
    }
  }
}
${VERSION_FRAGMENT}
`

// get tasks for folderIds used as mentions
export const FOLDER_MENTION_TASKS = `
query FoldersTasksForMentions($projectName: String!, $folderIds: [String!]!) {
  project(name: $projectName) {
    folders(ids: $folderIds) {
      edges {
        node {
          id
          name
          label
          tasks {
            edges {
              node {
                id
                name
                label
                taskType
                thumbnailId
                versions(latestOnly: true) {
                  edges {
                    node {
                      id
                      thumbnailId
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
`
