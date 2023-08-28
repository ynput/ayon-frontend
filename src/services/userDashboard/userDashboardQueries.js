export const KAN_BAN_QUERY = `
query KanBan($assignees: [String!]) {
    projects {
      edges {
        node {
          tasks(assignees: $assignees) {
            edges {
              node {
                id
                name
                status
                taskType
              }
            }
          }
          projectName
        }
      }
    }
  }
`
