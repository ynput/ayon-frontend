// const groupedMessage = {
//     date: date,
//     title: string,
//     subTitle: string,
//     img: string,
//     isMultiple: boolean,
//     items: [{message}],
//     changes: [string],
// }

import { isSameDay, parseISO } from 'date-fns'
import { useMemo } from 'react'
import RemoveMarkdown from 'remove-markdown'

const groupMessages = (messages = [], currentUser) => {
  const groups = []
  const visited = new Array(messages.length).fill(false) // Tracks if a message has been grouped
  
  const versionPublishGroups = groupVersionMessages(messages)
  const assigneeGroups = groupAssigneeMessages(messages)

  // Mark all grouped messages as visited and add their groups
  for (const folderMessages of versionPublishGroups) {
    if (folderMessages.length === 0) continue

    // Mark these messages as visited
    folderMessages.forEach((msg) => {
      const index = messages.findIndex((m) => m.activityId === msg.activityId)
      if (index !== -1) visited[index] = true
    })

    groups.push(folderMessages)
  }
  
  for (const reassignmentGroup of assigneeGroups) {
    if (reassignmentGroup.length === 0) continue

    // Mark these messages as visited
    reassignmentGroup.forEach((msg) => {
      const index = messages.findIndex((m) => m.activityId === msg.activityId)
      if (index !== -1) visited[index] = true
    })

    groups.push(reassignmentGroup)
  }

  // Now handle other message types with the original logic
  for (let i = 0; i < messages.length; i++) {
    if (visited[i]) continue // Skip if the message is already grouped

    const message = messages[i]
    const currentGroup = [message] // Start a new group with the current message
    const messageDate = new Date(message.createdAt)
    visited[i] = true // Mark this message as visited

    // Compare the current message with all subsequent messages
    for (let j = i + 1; j < messages.length; j++) {
      if (visited[j]) continue // Skip if the message is already grouped

      const nextMessage = messages[j]
      const nextMessageDate = new Date(nextMessage.createdAt)

      // Check if the next message meets the grouping criteria
      const sameDay = isSameDay(messageDate, nextMessageDate)
      const isSameType = nextMessage.activityType === message.activityType
      const isSameEntity = nextMessage.entityId === message.entityId

      let isSameAssignee = true
      // for assignee change, check if the user is currentUser
      if (message.activityType.includes('assignee')) {
        const assigneeIsMe = message?.activityData?.assignee === currentUser
        const nextAssigneeIsMe = nextMessage?.activityData?.assignee === currentUser
        // if they don't match, don't group
        if (assigneeIsMe !== nextAssigneeIsMe) {
          isSameAssignee = false
        }
      }

      const canGroupMessage = isSameType && isSameEntity && sameDay && isSameAssignee

      if (canGroupMessage) {
        currentGroup.push(nextMessage) // Add to the current group
        visited[j] = true // Mark this message as visited
      }
    }

    groups.push(currentGroup) // Add the current group to the list of groups
  }

  // Sort all groups by their most recent message date (newest first)
  groups.sort((a, b) => {
    const dateA = new Date(a[0].createdAt)
    const dateB = new Date(b[0].createdAt)
    return dateB - dateA
  })

  return groups // Return the list of grouped messages
}

const groupVersionMessages = (messages) => {
  const groupedByType = Object.groupBy(messages, (m) => m.activityType)

  // Handle both version.publish and reviewable messages
  const publishMessages = groupedByType?.['version.publish'] || []
  const reviewableMessages = groupedByType?.['reviewable'] || []
  const messagesToGroup = [...publishMessages, ...reviewableMessages]

  // If there's only 1 message total, don't apply special grouping
  if (messagesToGroup.length === 1) {
    return []
  }

  // Group by time (5-minute windows)
  const groupedByTime = Object.groupBy(messagesToGroup, (m) => {
    const date = parseISO(m.createdAt)
    if (isNaN(date)) return 'invalid-date'

    // Round down to nearest 5 minutes and reset seconds/milliseconds
    const rounded = new Date(date)
    rounded.setMinutes(Math.floor(date.getMinutes() / 5) * 5, 0, 0)
    return rounded.toISOString()
  })

  // Group by parent folder within each time window
  const folderGroups = []

  // Sort time windows chronologically (newest first to match inbox order)
  const sortedTimeEntries = Object.entries(groupedByTime)
    .filter(([key]) => key !== 'invalid-date')
    .sort(([timeA], [timeB]) => new Date(timeB) - new Date(timeA))

  for (const [, timeGroup] of sortedTimeEntries) {
    if (timeGroup.length === 0) continue

    // Group by parent folder within this time window
    const groupedByFolder = Object.groupBy(timeGroup, (m) => {
      const parentFolder = m.activityData?.parents?.[0]
      return parentFolder?.id || 'no-parent'
    })

    // Add each folder group to the result
    for (const [folderId, folderMessages] of Object.entries(groupedByFolder)) {
      if (folderId === 'no-parent' || folderMessages.length === 0) continue

      // Sort messages within the folder group by time (newest first)
      const sortedMessages = folderMessages.sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      )

      folderGroups.push(sortedMessages)
    }
  }

  return folderGroups
}
const groupAssigneeMessages = (messages) => {
  const removes = messages.filter((m) => m.activityType === 'assignee.remove')
  const adds = messages.filter((m) => m.activityType === 'assignee.add')
  const groups = []
  const used = new Set()

  const entityTimeWindowGroups = new Map()

  // Sort all messages by time to ensure chronological processing
  const allAssigneeMessages = [...removes, ...adds].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  )

  allAssigneeMessages.forEach((msg) => {
    if (used.has(msg.activityId)) return

    const entityId = msg.entityId
    const msgTime = new Date(msg.createdAt)
    
    if (!entityTimeWindowGroups.has(entityId)) {
      entityTimeWindowGroups.set(entityId, [])
    }

    const timeWindowGroups = entityTimeWindowGroups.get(entityId)

    // Check if this message belongs to an existing time window group
    let addedToGroup = false
    for (const timeWindowGroup of timeWindowGroups) {
      const groupTime = new Date(timeWindowGroup[0].createdAt)
      const timeDiff = Math.abs(msgTime - groupTime)

      // Strictly less than 5 seconds to avoid edge cases
      if (timeDiff < 5000) {
        timeWindowGroup.push(msg)
        addedToGroup = true
        break
      }
    }

    if (!addedToGroup) {
      timeWindowGroups.push([msg])
    }
  })

  // Process each entity's time window groups to create assignee change messages
  entityTimeWindowGroups.forEach((timeWindowGroups) => {
    timeWindowGroups.forEach((group) => {
      const groupRemoves = group.filter((m) => m.activityType === 'assignee.remove')
      const groupAdds = group.filter((m) => m.activityType === 'assignee.add')

      // Collect all removed and added assignees
      const removedAssignees = new Set(
        groupRemoves.map((m) => m.activityData?.assignee).filter(Boolean),
      )
      const addedAssignees = new Set(
        groupAdds.map((m) => m.activityData?.assignee).filter(Boolean),
      )

      // Calculate net changes
      const netRemoved = new Set(
        [...removedAssignees].filter((assignee) => !addedAssignees.has(assignee)),
      )
      const netAdded = new Set(
        [...addedAssignees].filter((assignee) => !removedAssignees.has(assignee)),
      )

      // If there are no net changes (e.g., user removed then added back), hide the group
      if (netRemoved.size === 0 && netAdded.size === 0) {
        group.forEach((m) => used.add(m.activityId))
        return
      }

      // Only create grouped messages for multiple operations, not single ones
      if (group.length >= 2) {
        const isMultipleAddsOnly = groupRemoves.length === 0 && groupAdds.length >= 2
        const isMultipleRemovesOnly = groupAdds.length === 0 && groupRemoves.length >= 2
        const isReassignment = netRemoved.size > 0 && netAdded.size > 0

        if (isMultipleAddsOnly || isMultipleRemovesOnly || isReassignment) {
          // This group should be shown as a combined message
          const sortedGroup = group.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
          groups.push(sortedGroup)
        }
        // Mark all messages as used regardless of whether they were grouped
        group.forEach((m) => used.add(m.activityId))
      } else {
        // Single messages: add them individually and mark as used to prevent fallback grouping
        groups.push(group)
        group.forEach((m) => used.add(m.activityId))
      }
    })
  })

  return groups
}

const getChangedValues = (messages = []) => {
  const reversedMessages = messages.slice().reverse()
  const uniqueValues = []

  for (const message of reversedMessages) {
    const oldValue = message.activityData.oldValue
    if (oldValue !== undefined && uniqueValues.includes(oldValue)) {
      const index = uniqueValues.indexOf(oldValue)
      uniqueValues.splice(index, 1)
    }
    if (oldValue !== undefined) {
      uniqueValues.push(oldValue)
    }
  }

  const firstNewValue = messages[0]?.activityData.newValue
  if (firstNewValue !== undefined) {
    if (uniqueValues.includes(firstNewValue)) {
      const index = uniqueValues.indexOf(firstNewValue)
      uniqueValues.splice(index, 1)
    }
    uniqueValues.push(firstNewValue)
  }

  return uniqueValues
}

const transformGroups = (groups = []) => {
  return groups.map((group) => {
    const firstMessage = group[0] || {}
    const lastMessage = group[group.length - 1] || {}
    const isMultiple = group.length > 1
    const img = firstMessage.thumbnail.icon
    const date = firstMessage.createdAt
    // if every message in the group is read, then the group is read
    const read = group.every((m) => m.read)
    const unReadCount = group.filter((m) => !m.read).length

    let { activityType, projectName, author = {}, entityId, entityType, origin } = firstMessage

    const { activityId } = lastMessage

    // Check if this is an assignee change group
    const removeMessages = group.filter((m) => m.activityType === 'assignee.remove')
    const addMessages = group.filter((m) => m.activityType === 'assignee.add')
    const hasAssigneeChanges = removeMessages.length > 0 || addMessages.length > 0

    let customBody = null

    if (hasAssigneeChanges && isMultiple) {
      // Build a user lookup map from messages (user ID -> full name)
      const userLookup = new Map()

      // Collect user info from all assignee messages in the group
      const allAssigneeMessages = [...removeMessages, ...addMessages]
      allAssigneeMessages.forEach((msg) => {
        const userId = msg.activityData?.assignee
        if (userId && !userLookup.has(userId)) {
          // Try to extract full name from message body as fallback
          const nameMatch = msg.body?.match(/\[([^\]]+)\]\(user:.*?\)/)
          const fullName = nameMatch ? nameMatch[1] : userId
          userLookup.set(userId, fullName)
        }
      })

      // Extract entity link from first message
      const firstMsg = removeMessages[0] || addMessages[0]
      const entityLinkMatch = firstMsg.body?.match(/(?:from|to) (\[.*?\]\(.*?\))/)
      const entityLink = entityLinkMatch ? entityLinkMatch[1] : ''

      // Collect all removed and added assignees (user IDs)
      const removedAssignees = new Set(
        removeMessages.map((m) => m.activityData?.assignee).filter(Boolean),
      )
      const addedAssignees = new Set(
        addMessages.map((m) => m.activityData?.assignee).filter(Boolean),
      )

      // Calculate net changes
      const netRemoved = [...removedAssignees].filter((assignee) => !addedAssignees.has(assignee))
      const netAdded = [...addedAssignees].filter((assignee) => !removedAssignees.has(assignee))

      // Build lists of usernames using the lookup map
      const removedUserNames = netRemoved
        .map((userId) => userLookup.get(userId))
        .filter(Boolean)

      const addedUserNames = netAdded
        .map((userId) => userLookup.get(userId))
        .filter(Boolean)

      // Determine a message type based on what we have
      if (removedUserNames.length > 0 && addedUserNames.length > 0) {
        // Reassignment: both adds and removes
        activityType = 'assignee.reassign'
        const removedList = removedUserNames.join(', ')
        const addedList = addedUserNames.join(', ')
        customBody = `${author.attrib.fullName || author.name || ""}: Reassigned ${entityLink} from ${removedList} to ${addedList}`
      } else if (addedUserNames.length > 0) {
        // Multiple adds only
        activityType = 'assignee.add'
        const addedList = addedUserNames.join(', ')
        customBody = `${author.attrib.fullName || author.name || ""}: Added ${addedList} to ${entityLink}`
      } else if (removedUserNames.length > 0) {
        // Multiple removes only
        activityType = 'assignee.remove'
        const removedList = removedUserNames.join(', ')
        customBody = `${author.attrib.fullName || author.name || ""}: Removed ${removedList} from ${entityLink}`
      }
    }

    // For grouped version.publish or reviewable messages, use the parent folder as the entity
    let finalEntityId = entityId
    let finalEntityType = entityType
    let finalPath = firstMessage.path

    // Check if this group contains version.publish or reviewable messages
    const hasVersionOrReview = group.some(m =>
      m.activityType === 'version.publish' || m.activityType === 'reviewable'
    )

    if (isMultiple && hasVersionOrReview) {
      // Use the parent folder (first item in parents array) as the entity
      const parentFolder = firstMessage.activityData?.parents?.[0]
      if (parentFolder) {
        finalEntityId = parentFolder.id
        finalEntityType = parentFolder.type
        // Show only the parent folder in the path
        finalPath = [parentFolder.label || parentFolder.name]

        const authorMap = new Map()
        group.forEach(msg => {
          if (msg.author) {
            const authorKey = msg.author.name
            if (!authorMap.has(authorKey)) {
              authorMap.set(authorKey, msg.author)
            }
          }
        })

        const authors = Array.from(authorMap.values())
        const versionCount = group.length
        const hasReviewable = group.some(m => m.activityType === 'reviewable')

        // Use only the primary author
        const primaryAuthor = authors[0]?.attrib?.fullName || authors[0]?.name

        // Collect product names from the group
        const productNames = []
        group.forEach(msg => {
          // Get product name from activityData.context
          const productName = msg.activityData?.context?.productName
          if (productName && !productNames.includes(productName)) {
            productNames.push(productName)
          }
        })

        // Build the description based on count
        let actionText
        if (versionCount <= 4 && productNames.length > 0) {
          // Show individual product names when 4 or fewer versions
          const productList = productNames.join(', ')
          actionText = hasReviewable
            ? `Published and submitted new versions for review to ${productList}`
            : `Published new versions to ${productList}`
        } else {
          // Show version and product counts when more than 4 versions
          const versionText = versionCount === 1 ? 'new version' : 'new versions'
          const productCount = productNames.length
          const productText = productCount === 1 ? 'product' : 'products'

          if (productCount > 0) {
            actionText = hasReviewable
              ? `Published and submitted ${versionCount} ${versionText} for review to ${productCount} ${productText}`
              : `Published ${versionCount} ${versionText} to ${productCount} ${productText}`
          } else {
            // Fallback if no product names found
            actionText = hasReviewable
              ? `Published and submitted ${versionCount} ${versionText} for review`
              : `Published ${versionCount} ${versionText}`
          }
        }

        if (primaryAuthor) {
          customBody = `${primaryAuthor}: ${actionText}`
        }
      }
    }

    const result = {
      activityId: activityId,
      groupIds: group.map((m) => m.activityId),
      activityType: activityType,
      projectName: projectName,
      entityId: finalEntityId,
      entityType: finalEntityType,
      entitySubType: origin?.subtype,
      userName: author?.name,
      changes: getChangedValues(group),
      read: read,
      unRead: unReadCount,
      path: finalPath,
      date,
      img,
      isMultiple,
      messages: group,
    }
    
    if (customBody) {
      result.body = RemoveMarkdown(customBody)
    }

    return result
  })
}

const useGroupMessages = ({ messages, currentUser }) => {
  console.log(messages)
  const grouped = useMemo(() => {
    // const simpleGroups = messages.map((message) => [message])
    const simpleGroups = groupMessages(messages, currentUser)
    const transformedGroups = transformGroups(simpleGroups)
    // console.log(transformedGroups)
    return transformedGroups
  }, [messages])

  return grouped
}

export default useGroupMessages
