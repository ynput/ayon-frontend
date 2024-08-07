// data for entity kanban card and details panel

import ayonClient from '@/ayon'

// the extra attribs are for the entity details panel only
const TASK_FRAGMENT = () => `
  fragment TaskFragment on TaskNode {
    id
    name
    label
    status
    tags
    taskType
    assignees
    updatedAt
    createdAt
    folderId
    thumbnailId
    hasReviewables
    folder {
      name
      label
      path
    }
    versions(last: 1) {
      edges {
        node {
          id
          thumbnailId
          name
          updatedAt
          createdAt
          productId
        }
      }
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
              attrib {
                ${attribs.join('\n')}
              }
              ...TaskFragment
            }
          }
        }
      }
    }
${TASK_FRAGMENT()}
`

export const TASK_DETAILS = (attribs = []) => `
query GetTaskDetails($projectName: String!, $entityId: String!) {
  project(name: $projectName) {
    projectName
    code
    task(id: $entityId) {
      attrib {
        ${attribs.join('\n')}
      }
      ...TaskFragment
    }
  }
}
${TASK_FRAGMENT()}
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

export const VERSION_DETAILS_QUERY = (attribs = []) => `
    query VersionsDetails($projectName: String!, $entityId: String!) {
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
                createdAt
                thumbnailId
                hasReviewables
                product {
                  id
                  name
                  productType
                  folder {
                    id
                    path
                    name
                    parents
                  }
                }
                attrib {
                  ${attribs.join('\n')}
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
`

export const FOLDER_DETAILS_QUERY = (attribs = []) => `
query FolderDetails($projectName: String!, $entityId: String!) {
  project(name: $projectName) {
      projectName
      code
      folder(id: $entityId) {
          id
          name
          label
          status
          tags
          updatedAt
          createdAt
          thumbnailId
          folderType
          path
          hasReviewables
          attrib {
            ${attribs.join('\n')}
          }
      }
  }
}`

export const REP_QUERY = (attribs) => `
    query RepresentationDetails($projectName: String!, $entityId: String!) {
      project(name: $projectName) {
        representation(id: $entityId) {
          id
          versionId
          name
          status
          tags
          updatedAt
          hasReviewables
          attrib {
            ${attribs.join('\n')}
          }
          context
          version {
            name
            author
          }
        }
      }
    }
`

export const entityDetailsTypesSupported = ['task', 'version', 'folder', 'representation']
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
      return TASK_DETAILS(attribs)
    case 'version':
      return VERSION_DETAILS_QUERY(attribs)
    case 'folder':
      return FOLDER_DETAILS_QUERY(attribs)
    case 'representation':
      return REP_QUERY(attribs)
    default:
      break
  }
}
