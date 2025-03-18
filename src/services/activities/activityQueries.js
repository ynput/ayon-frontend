export const ACTIVITY_FRAGMENT = `
fragment ActivityFragment on ActivityNode {
    activityId
    activityType
    activityData
    referenceType
    referenceId
    entityId
    body
    createdAt
    updatedAt
    author {
      name
      deleted
      active
      attrib {
        fullName
      }
    }
    files {
      id
      name
      size
      mime
    }
    origin {
      id
      name
      label
      type
    }
    reactions {
      fullName
      userName
      reaction
      timestamp
    }
    version {
      attrib {
        comment
      }
    }
  }
`

export const ACTIVITIES = `
query getEntitiesActivities($projectName: String!, $entityIds: [String!]!, $cursor: String, $last: Int, $referenceTypes: [String!], $activityTypes: [String!]) {
  project(name: $projectName) {
    name
    activities(entityIds: $entityIds, last: $last, before: $cursor, referenceTypes: $referenceTypes, activityTypes: $activityTypes) {
      pageInfo {
        hasPreviousPage
        startCursor
        endCursor
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

export const CHECKLISTS = `
query getEntitiesChecklists($projectName: String!, $entityIds: [String!]!) {
  project(name: $projectName) {
    name
    activities(entityIds: $entityIds, last: 1000, activityTypes: ["checklist"], referenceTypes: ["origin", "mention", "relation"]) {
      edges {
        cursor
        node {
          activityId
          body
        }
      }
    }
  }
}
`

export const ACTIVITIES_BY_ACTIVITY = `
query getEntitiesActivities($projectName: String!, $entityIds: [String!]!, $activityIds: [String!]) {
  project(name: $projectName) {
    name
    activities(entityIds: $entityIds, activityIds: $activityIds) {
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
        comment
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
