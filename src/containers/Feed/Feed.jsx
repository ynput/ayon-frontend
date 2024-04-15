import React, { useEffect, useMemo, useRef, useState } from 'react'
import ActivityItem from '../../components/Feed/ActivityItem'
import CommentInput from '/src/components/CommentInput/CommentInput'
import * as Styled from './Feed.styled'
import { useGetActivitiesQuery, useGetVersionsQuery } from '/src/services/activities/getActivities'
import useCommentMutations from './hooks/useCommentMutations'
import useTransformActivities from './hooks/useTransformActivities'

const Feed = ({ tasks = [], activeUsers, selectedTasksProjects = [], projectsInfo }) => {
  // STATES
  const [isCommentInputOpen, setIsCommentInputOpen] = useState(false)

  const entitiesToQuery = useMemo(
    () => tasks.map((task) => ({ id: task.id, projectName: task.projectName, type: 'task' })),
    [tasks],
  )

  const { data: activitiesData = [] } = useGetActivitiesQuery({
    entities: entitiesToQuery,
  })

  // get all versions for the task
  const { data: versionsData = [] } = useGetVersionsQuery({
    entities: entitiesToQuery,
  })

  // do any transformation on activities data
  // 1. status change activities, attach status data based on projectName
  // 2. reverse the order
  const transformedActivitiesData = useTransformActivities(activitiesData, projectsInfo)

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

  // TODO: this only works for the first selected task
  const projectName = selectedTasksProjects[0]
  const entityType = 'task'
  const entityId = tasks[0].id

  // comment mutations here!
  const { submitComment, updateComment, deleteComment } = useCommentMutations({
    projectName,
    entityType,
    entityId,
    entitiesToQuery,
  })

  // When a checkbox is clicked, update the body to add/remove "x" in [ ] markdown
  // Then update comment with new body
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

    updateComment(activity, newBody)
  }

  return (
    <Styled.FeedContainer>
      <Styled.FeedContent ref={feedRef}>
        {transformedActivitiesData.map((activity) => (
          <ActivityItem
            key={activity.activityId}
            activity={activity}
            onCheckChange={handleCommentChecked}
            onDelete={deleteComment}
          />
        ))}
      </Styled.FeedContent>
      {!!tasks.length && (
        <CommentInput
          initValue={null}
          onSubmit={submitComment}
          isOpen={isCommentInputOpen}
          setIsOpen={setIsCommentInputOpen}
          activeUsers={activeUsers}
          selectedTasksProjects={selectedTasksProjects}
          versions={versionsData}
          entities={tasks}
          projectsInfo={projectsInfo}
        />
      )}
    </Styled.FeedContainer>
  )
}

export default Feed
