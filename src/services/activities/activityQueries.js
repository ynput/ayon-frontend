export const ACTIVITY_FRAGMENT = `
fragment ActivityFragment on ActivityNode {
    activityId
    activityType
    referenceType
    referenceId
    body
    createdAt
    author {
      name
      attrib {
        fullName
        avatarUrl
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

export const ENTITY_ACTIVITIES = (type) => `
query getEntityActivity($projectName: String!, $entityId: String!) {
    project(name: $projectName) {
      ${type}(id: $entityId) {
        name
        activities {
          edges {
            node {
              ...ActivityFragment
            }
          }
        }
      }
    }
  }
${ACTIVITY_FRAGMENT}
`
