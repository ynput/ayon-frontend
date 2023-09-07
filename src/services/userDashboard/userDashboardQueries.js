const TASK_FRAGMENT = `
  fragment TaskFragment on TaskNode {
    id
    name
    status
    taskType
    assignees
    updatedAt
    folderId
    folder {
      name
      path
    }
    versions(latestOnly: true) {
      edges {
        node {
          id
          thumbnailId
          updatedAt
        }
      }
    }
    allVersions: versions {
      edges {
        node {
          name
          version
          thumbnailId
          updatedAt
        }
      }
    }
  }
`

export const PROJECT_TASKS_QUERY = `
query KanBan($assignees: [String!], $projectName: String!) {
  project(name: $projectName) {
        projectName
        tasks(assigneesAny: $assignees) {
          edges {
            node {
              ...TaskFragment
            }
          }
        }
      }
    }
${TASK_FRAGMENT}
`

export const KAN_BAN_TASK_QUERY = `
query KanBanTask($projectName: String!, $taskId: String!) {
  project(name: $projectName) {
    projectName
    task(id: $taskId) {
      ...TaskFragment
    }
  }
}
${TASK_FRAGMENT}
`
export const KAN_BAN_ASSIGNEES_QUERY = `
query Assignees($projectName: String) {
  users(last: 2000 projectName: $projectName) {
  edges {
    node {
      name
      attrib {
        avatarUrl
        fullName
      }
    }
  }
}
}`

export const KAN_BAN_TASK_MENTIONS_QUERY = `
query SearchMentionTasks($projectName: String!, $assignees: [String!]!) {
  project(name: $projectName) {
    projectName
    tasks(assignees: $assignees) {
      edges {
        node {
          id
          name
          taskType
          status
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
`
