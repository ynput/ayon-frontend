import React, { useEffect, useMemo, useRef, useState } from 'react'
import ActivityItem from '../../components/Feed/ActivityItem'
import CommentInput from '/src/components/CommentInput/CommentInput'
import * as Styled from './Feed.styled'
import { useSelector } from 'react-redux'
import { useGetActivitiesQuery } from '/src/services/activities/getActivities'
import { useUpdateActivityMutation } from '/src/services/activities/updateActivities'
import { v1 as uuid1 } from 'uuid'
import { formatISO } from 'date-fns'

const Feed = ({ tasks = [], activeUsers, selectedTasksProjects = [], projectsInfo }) => {
  const { name, fullName, avatarUrl } = useSelector((state) => state.user)

  // STATES
  const [isCommentInputOpen, setIsCommentInputOpen] = useState(false)

  const entitiesToQuery = useMemo(
    () => tasks.map((task) => ({ id: task.id, projectName: task.projectName, type: 'task' })),
    [tasks],
  )

  const { data: activitiesData = [] } = useGetActivitiesQuery({
    entities: entitiesToQuery,
  })

  // sort reversed activities data
  const reversedActivitiesData = useMemo(() => activitiesData.slice().reverse(), [activitiesData])

  // REFS
  const feedRef = useRef(null)
  // const commentInputRef = useRef(null)

  // scroll by height of comment input when it opens or closes
  // for now use hard coded value
  useEffect(() => {
    if (!feedRef.current) return
    const heightDiff = 93

    const isAtBottom = feedRef.current.scrollTop === 0

    if (!isAtBottom) {
      if (isCommentInputOpen) feedRef.current.scrollBy(0, heightDiff)
      else feedRef.current.scrollBy(0, -heightDiff)
    }
  }, [isCommentInputOpen, feedRef.current])

  const tasksVersions = tasks.flatMap((task) => task.allVersions) || []

  // used to create and update activities (comments)
  const [updateActivity] = useUpdateActivityMutation()

  const handleCommentSubmit = async (value) => {
    const newComment = {
      body: value,
      activityType: 'comment',
      activityId: uuid1().replace(/-/g, ''),
    }

    // TODO: this only works for the first selected task
    const projectName = selectedTasksProjects[0]
    const entityType = 'task'
    const entityId = tasks[0].id

    // create a new patch for optimistic update
    const patch = {
      ...newComment,
      referenceType: 'origin',
      authorName: name,
      authorFullName: fullName,
      authorAvatarUrl: avatarUrl,
      createdAt: formatISO(new Date()),
    }

    try {
      await updateActivity({
        projectName,
        entityType,
        entityId,
        data: newComment,
        patch,
      }).unwrap()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Styled.FeedContainer>
      <Styled.FeedContent ref={feedRef}>
        {reversedActivitiesData.map((activity) => (
          <ActivityItem
            key={activity.activityId}
            activity={activity}
            users={activeUsers}
            entityType={'task'}
          />
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
          entities={tasks}
          projectsInfo={projectsInfo}
        />
      )}
    </Styled.FeedContainer>
  )
}

export default Feed
