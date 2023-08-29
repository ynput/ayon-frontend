const TASK_FRAGMENT = `
  fragment TaskFragment on TaskNode {
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
`

export const PROJECT_TASKS_QUERY = `
query KanBan($assignees: [String!], $projectName: String!) {
  project(name: $projectName) {
        projectName
        tasks(assignees: $assignees) {
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
