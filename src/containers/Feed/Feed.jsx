import React, { useMemo, useState } from 'react'
import getCommentsForTasks from './commentsData'
import FeedItem from '/src/components/Feed/FeedItem'
import { compareAsc } from 'date-fns'
import CommentInput from '/src/components/CommentInput/CommentInput'
import * as Styled from './Feed.styled'
import { uuid } from 'short-uuid'
import { useSelector } from 'react-redux'

const Feed = ({
  tasks = [],
  allTasks = [],
  allUsers = [],
  activeUsers,
  selectedTasksProjects = [],
}) => {
  const name = useSelector((state) => state.user.name)

  // STATES
  const [isCommentInputOpen, setIsCommentInputOpen] = useState(false)
  // for testing only!!!
  const [textNewComments, setTextNewComments] = useState([])

  const isAllComments = !tasks.length

  const entityIds = useMemo(() => tasks.map((task) => task.id), [tasks])

  // GET COMMENTS (FOR NOW DEMO DATA)
  const events = []

  const commentsData = getCommentsForTasks(allTasks, allUsers)

  // add comments to events list
  if (!isAllComments) {
    const comments = [...commentsData, ...textNewComments].filter((comment) =>
      entityIds.includes(comment.entityId),
    )
    events.push(...comments)
  } else {
    // add all comments but with reference to the task, this gives every comment "on task" tag
    const allCommentsAsReferences = commentsData.map((comment) => ({
      ...comment,
      reference: comment,
    }))
    events.push(...allCommentsAsReferences)
  }

  const tasksVersions = tasks.flatMap((task) => task.allVersions) || []

  const references = [...commentsData]
    .filter(
      (comment) =>
        comment?.references.some((ref) => entityIds.includes(ref.refId)) &&
        !entityIds.includes(comment.entityId),
    )
    .map((c) => {
      const ref = c?.references.find((ref) => entityIds.includes(ref.refId))

      return { reference: ref, ...c }
    })

  events.push(...references)

  console.log(references)

  // sort events by date
  events.sort((a, b) => compareAsc(new Date(a.createdAt), new Date(b.createdAt)))

  const handleCommentSubmit = (value) => {
    console.log(value)
    const newComments = []

    for (const task of tasks) {
      const newComment = {
        id: uuid(),
        author: name,
        body: value?.body,
        createdAt: new Date(),
        entityId: task.id,
        entityName: task.name,
        entityType: 'task',
        eventType: 'comment',
        references: value?.references,
      }

      newComments.push(newComment)
    }

    setTextNewComments([...textNewComments, ...newComments])
  }

  return (
    <Styled.FeedContainer>
      <Styled.FeedContent>
        {events.map((event) => (
          <FeedItem key={event.id} {...event} users={activeUsers} />
        ))}
      </Styled.FeedContent>
      {!!tasks.length && (
        <CommentInput
          initValue={null}
          onSubmit={handleCommentSubmit}
          isOpen={isCommentInputOpen}
          setIsOpen={setIsCommentInputOpen}
          activeUsers={activeUsers}
          selectedTasksProjects={selectedTasksProjects}
          versions={tasksVersions}
          userName={name}
        />
      )}
    </Styled.FeedContainer>
  )
}

export default Feed
