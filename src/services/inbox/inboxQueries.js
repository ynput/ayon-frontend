export const MESSAGE_FRAGMENT = `
fragment MessageFragment on ActivityNode {
    projectName
    activityId
    activityType
    activityData
    referenceType
    referenceId
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
    parents {
      type
      name
      label
    }
  }
`

export const INBOX_ACTIVITIES = `
query getInboxMessages($last: Int, $active: Boolean, $important: Boolean, $cursor: String) {
  inbox(last: $last, showActiveMessages: $active, showImportantMessages: $important, before: $cursor){
    pageInfo {
      hasPreviousPage
      startCursor
      endCursor
    }
    edges {
      cursor
      node {
        ...MessageFragment
      }
    }
  }
}
${MESSAGE_FRAGMENT}
`

export const INBOX_HAS_UNREAD = `
query getInboxHasUnread {
  inbox(last: 1, showActiveMessages: true, showImportantMessages: true, showUnreadMessages: true){
    edges {
      node {
        referenceId
        read
      }
    }
  }
} 
`

export const INBOX_UNREAD_COUNT = `
query getInboxUnreadCount($important: Boolean) {
  inbox(last: 500, showActiveMessages: true, showImportantMessages: $important, showUnreadMessages: true){
    edges {
      node {
        referenceId
        read
      }
    }
  }
} 
`
