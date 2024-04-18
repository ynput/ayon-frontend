const TASK_FRAGMENT = `
  fragment TaskFragment on TaskNode {
    id
    name
    label
    status
    tags
    taskType
    assignees
    updatedAt
    folderId
    thumbnailId
    attrib {
      endDate
    }
    folder {
      name
      label
      path
    }
  }
`

export const PROJECT_TASKS_QUERY = `
query KanBan($assignees: [String!], $projectName: String!) {
  project(name: $projectName) {
        projectName
        code
        tasks(assigneesAny: $assignees, last: 2000) {
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
    code
    task(id: $taskId) {
      ...TaskFragment
    }
  }
}
${TASK_FRAGMENT}
`
export const KAN_BAN_ASSIGNEES_QUERY = `
query KanbanProjectAssignees($projectName: String) {
  users(last: 2000 projectName: $projectName) {
  edges {
    node {
      name
      accessGroups
      attrib {
        fullName
      }
    }
  }
}
}`

export const TASK_MENTION_TASKS = `
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
