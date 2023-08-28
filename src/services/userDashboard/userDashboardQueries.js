export const KAN_BAN_QUERY = `
query KanBan($assignees: [String!]) {
    projects {
      edges {
        node {
          projectName
          tasks(assignees: $assignees) {
            edges {
              node {
                id
                name
                status
                taskType
                assignees
                folderId
                folder {
                  name
                  path
                }
              }
            }
          }
        }
      }
    }
  }
`
