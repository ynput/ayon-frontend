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
    updatedAt
    active
    read
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
query getInboxMessages($last: Int, $active: Boolean, $important: Boolean) {
  inbox(last: $last, showActiveMessages: $active, showImportantMessages: $important){
    edges {
      cursor
      node {
        ...ActivityFragment
      }
    }
  }
}
${ACTIVITY_FRAGMENT}
`
