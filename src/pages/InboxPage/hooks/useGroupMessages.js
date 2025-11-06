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
  const usedAdds = new Set()
  const usedRemoves = new Set()
  
  removes.forEach((remove) => {
    if (usedRemoves.has(remove.activityId)) return

    const removeTime = new Date(remove.createdAt)
    const matchingAdd = adds.find((add) => {
      if (usedAdds.has(add.activityId)) return false
      if (add.entityId !== remove.entityId) return false

      const addTime = new Date(add.createdAt)
      const timeDiff = Math.abs(addTime - removeTime)
      
      return timeDiff <= 5000
    })

    if (matchingAdd) {
      const addTime = new Date(matchingAdd.createdAt)
      const removeIsFirst = removeTime < addTime
      
      if (removeIsFirst) {
        groups.push([remove, matchingAdd])
      } else {
        groups.push([matchingAdd, remove])
      }

      usedAdds.add(matchingAdd.activityId)
      usedRemoves.add(remove.activityId)
    }
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

    // Check if this is a reassignment group (remove + add in either order)
    const isReassignment =
      group.length === 2 &&
      ((group[0].activityType === 'assignee.remove' && group[1].activityType === 'assignee.add') ||
        (group[0].activityType === 'assignee.add' && group[1].activityType === 'assignee.remove'))

    let customBody = null

    if (isReassignment) {
      // Use a special activity type for reassignments
      activityType = 'assignee.reassign'

      // Find the remove and add messages
      const removeMsg = group.find((m) => m.activityType === 'assignee.remove')
      const addMsg = group.find((m) => m.activityType === 'assignee.add')

      if (removeMsg && addMsg) {
        // Extract entity link from either message (both should have it)
        // Format: "... from [entity_name](type:id)" or "... to [entity_name](type:id)"
        const entityLinkMatch =
          removeMsg.body?.match(/(?:from|to) (\[.*?\]\(.*?\))/) ||
          addMsg.body?.match(/(?:from|to) (\[.*?\]\(.*?\))/)
        const entityLink = entityLinkMatch ? entityLinkMatch[1] : ''

        // Extract removed user link from remove message
        // Format: "Removed [User Name](user:id) from ..."
        const removedUserMatch = removeMsg.body?.match(/Removed (\[.*?\]\(user:.*?\))/)
        const removedUser = removedUserMatch ? removedUserMatch[1] : ''

        // Extract added user link from add message
        // Format: "Added [User Name](user:id) to ..."
        const addedUserMatch = addMsg.body?.match(/Added (\[.*?\]\(user:.*?\))/)
        const addedUser = addedUserMatch ? addedUserMatch[1] : ''

        // Create the reassignment body message
        if (entityLink && removedUser && addedUser) {
          customBody = `Reassigned ${entityLink} from ${removedUser} to ${addedUser}`
        }
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

    // Add custom body if it's a reassignment
    if (customBody) {
      result.body = RemoveMarkdown(customBody)
    }

    return result
  })
}

const useGroupMessages = ({ messages, currentUser }) => {
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
