// const groupedMessage = {
//     date: date,
//     title: string,
//     subTitle: string,
//     img: string,
//     isMultiple: boolean,
//     items: [{message}],
//     changes: [string],
// }

import { isSameDay } from 'date-fns'
import { useMemo } from 'react'

const groupMessages = (messages = [], currentUser) => {
  const groups = []
  const visited = new Array(messages.length).fill(false) // Tracks if a message has been grouped

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

  return groups // Return the list of grouped messages
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

    const { activityType, projectName, author = {}, entityId, entityType, origin } = firstMessage

    const { activityId } = lastMessage

    return {
      activityId: activityId,
      groupIds: group.map((m) => m.activityId),
      activityType: activityType,
      projectName: projectName,
      entityId: entityId,
      entityType: entityType,
      entitySubType: origin?.subtype,
      userName: author?.name,
      changes: getChangedValues(group),
      read: read,
      unRead: unReadCount,
      path: firstMessage.path,
      date,
      img,
      isMultiple,
      messages: group,
    }
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
