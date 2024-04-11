import React, { useEffect, useMemo, useRef, useState } from 'react'
import ActivityItem from '../../components/Feed/ActivityItem'
import CommentInput from '/src/components/CommentInput/CommentInput'
import * as Styled from './Feed.styled'
import { useSelector } from 'react-redux'
import { useGetActivitiesQuery } from '/src/services/activities/getActivities'
import {
  useCreateEntityActivityMutation,
  useDeleteActivityMutation,
  useUpdateActivityMutation,
} from '/src/services/activities/updateActivities'
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
  const [createEntityActivity] = useCreateEntityActivityMutation()
  const [updateActivity] = useUpdateActivityMutation()
  const [deleteActivity] = useDeleteActivityMutation()

  // TODO: this only works for the first selected task
  const projectName = selectedTasksProjects[0]
  const entityType = 'task'
  const entityId = tasks[0].id

  const handleCommentSubmit = async (value) => {
    const newId = uuid1().replace(/-/g, '')

    const newComment = {
      body: value,
      activityType: 'comment',
      id: newId,
    }

    // create a new patch for optimistic update
    const patch = {
      body: value,
      activityType: 'comment',
      activityId: newId,
      referenceType: 'origin',
      authorName: name,
      authorFullName: fullName,
      authorAvatarUrl: avatarUrl,
      createdAt: formatISO(new Date()),
    }

    // we only need these args to update the cache of the original query
    const argsForCachingMatching = { entities: entitiesToQuery }

    try {
      await createEntityActivity({
        projectName,
        entityType,
        entityId,
        data: newComment,
        patch,
        ...argsForCachingMatching,
      }).unwrap()
    } catch (error) {
      console.error(error)
    }
  }

  const handleCommentUpdate = async (activity, value) => {
    const updatedActivity = {
      body: value,
    }

    const patch = {
      ...activity,
      ...updatedActivity,
    }

    // we only need these args to update the cache of the original query
    const argsForCachingMatching = { entityType, entityId, entities: entitiesToQuery }

    try {
      await updateActivity({
        projectName,
        data: updatedActivity,
        activityId: activity.activityId,
        patch,
        ...argsForCachingMatching,
      }).unwrap()
    } catch (error) {
      // error is handled in the mutation
    }
  }

  const handleCommentChecked = (e, activity) => {
    const target = e?.target
    if (!target || !activity) return console.log('no target or activity')

    // the value that it's changing to
    const checked = target.checked
    const currentMarkdown = checked ? '[ ]' : '[x]'
    const newMarkdown = checked ? '[x]' : '[ ]'

    const { body } = activity

    // based on all li elements in the whole className 'comment-body' with className 'task-list-item'
    // find the index of the task that was checked
    const taskIndex = Array.from(
      target.closest('.comment-body').querySelectorAll('.task-list-item'),
    ).findIndex((li) => li === target.closest('li'))

    let replaceIndex = taskIndex

    // count the number of current markdowns in the body
    const allMarkdowns = body.match(/\[.\]/g) || []

    allMarkdowns.forEach((markdown, index) => {
      // does it match the current markdown?
      if (markdown !== currentMarkdown && index < taskIndex) replaceIndex--
    })

    // now find the indexes of the current markdown to replace
    const indexesOfCurrentMarkdownInBody = []
    let index
    while ((index = body.indexOf(currentMarkdown, index + 1)) > -1) {
      indexesOfCurrentMarkdownInBody.push(index)
    }

    const indexToReplaceInBody = indexesOfCurrentMarkdownInBody[replaceIndex]
    const endReplaceIndex = indexToReplaceInBody + currentMarkdown.length

    // replace the current markdown with the new markdown
    const newBody = body.slice(0, indexToReplaceInBody) + newMarkdown + body.slice(endReplaceIndex)

    if (!newBody) return

    handleCommentUpdate(activity, newBody)
  }

  const handleCommentDelete = async (id) => {
    // we only need these args to update the cache of the original query
    const argsForCachingMatching = { entityType, entityId, entities: entitiesToQuery }

    if (!id) return

    try {
      await deleteActivity({
        projectName,
        activityId: id,
        patch: { activityId: id },
        ...argsForCachingMatching,
      }).unwrap()
    } catch (error) {
      // error is handled in the mutation
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
            onCheckChange={handleCommentChecked}
            onDelete={handleCommentDelete}
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
