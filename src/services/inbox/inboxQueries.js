export const ACTIVITY_FRAGMENT = `
fragment ActivityFragment on ActivityNode {
    projectName
    activityId
    activityType
    activityData
    referenceType
    referenceId
    entityId
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

export const INBOX_ACTIVITIES = `
query getInboxMessages($last: Int, $activityTypes: [String!]!) {
  projects{
    edges {
      node {
        projectName
        activities(referenceTypes: ["origin"], activityTypes: $activityTypes, last: $last) {
          edges {
            cursor
            node {
              ...ActivityFragment
            }
          }
        }
      }
    }
  }
}
${ACTIVITY_FRAGMENT}
`
