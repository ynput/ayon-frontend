export const ACTIVITY_FRAGMENT = `
fragment ActivityFragment on ActivityNode {
    activityId
    activityType
    activityData
    referenceType
    referenceId
    body
    createdAt
    author {
      name
      attrib {
        fullName
      }
    }
    origin {
      id
      name
      label
      type
    }
  }
`

export const ACTIVITIES = `
query getEntitiesActivities($projectName: String!, $entityIds: [String!]!, $cursor: String, $last: Int, $referenceTypes: [String!]) {
  project(name: $projectName) {
    name
    activities(entityIds: $entityIds, last: $last, before: $cursor, referenceTypes: $referenceTypes ) {
      pageInfo {
        hasPreviousPage
      }
      edges {
        cursor
        node {
          ...ActivityFragment
        }
      }
    }
  }
}
${ACTIVITY_FRAGMENT}
`

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
  }
}
`

export const ENTITY_VERSIONS = (type) => `
query getTaskVersions($projectName: String!, $entityId: String!) {
  project(name: $projectName) {
    versions(${type}Ids: [$entityId]) {
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

export const getTypeFields = (type) => {
  switch (type) {
    case 'task':
      return `
        label
        assignees
        taskType
        folder {
          name
          label
          path
        }  
      `
    case 'version':
      return `
        author
        product {
          name
          productType
          folder {
            path
          }
        }
      `
    default:
      return ''
  }
}

export const ENTITY_TOOLTIP = (type) => `
query EntityTooltip($projectName: String!, $entityId: String!) {
  project(name: $projectName) {
    ${type}(id: $entityId) {
      id
      name
      status
      thumbnailId
      updatedAt
      ${getTypeFields(type)}
    }
  }
}
`
