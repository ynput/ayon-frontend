// data for entity kanban card and details panel

import ayonClient from '/src/ayon'

// the extra attribs are for the entity details panel only
const TASK_FRAGMENT = (attribs = []) => `
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
      ${attribs.join('\n')}
    }
    folder {
      name
      label
      path
    }
  }
`

export const PROJECT_TASKS_QUERY = (attribs = []) => `
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
${TASK_FRAGMENT(attribs)}
`

export const KAN_BAN_TASK_QUERY = (attribs = []) => `
query KanBanTask($projectName: String!, $entityId: String!) {
  project(name: $projectName) {
    projectName
    code
    task(id: $entityId) {
      ...TaskFragment
    }
  }
}
${TASK_FRAGMENT(attribs)}
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

export const VERSION_DETAILS = (attribs = []) => `
    query Versions($projectName: String!, $entityId: String!) {
        project(name: $projectName) {
            projectName
            code
            version(id: $entityId) {
                id
                version
                name
                author
                status
                tags
                updatedAt
                thumbnailId
                product {
                  name
                  productType
                  folder {
                    id
                    path
                  }
                }
                attrib {
                  ${attribs.join('\n')}
                }
            }
        }
    }
`

// this is used for getting the correct query for the details panel
export const buildDetailsQuery = (entityType) => {
  // first get all attribs for the entity
  const attribs = []
  for (const attrib of ayonClient.settings.attributes) {
    if (attrib.scope.includes(entityType)) attribs.push(attrib.name)
  }

  // select correct query for the entity type
  switch (entityType) {
    case 'task':
      return KAN_BAN_TASK_QUERY(attribs)
    case 'version':
      return VERSION_DETAILS(attribs)
    default:
      break
  }
}
