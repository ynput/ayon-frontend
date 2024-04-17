import React, { useEffect, useMemo, useRef, useState } from 'react'
import ActivityItem from '../../components/Feed/ActivityItem'
import CommentInput from '/src/components/CommentInput/CommentInput'
import * as Styled from './Feed.styled'
import { useGetActivitiesQuery, useGetVersionsQuery } from '/src/services/activities/getActivities'
import useCommentMutations from './hooks/useCommentMutations'
import useTransformActivities from './hooks/useTransformActivities'
import { InView } from 'react-intersection-observer'
import { useSelector } from 'react-redux'

const Feed = ({ tasks = [], activeUsers, selectedTasksProjects = [], projectsInfo }) => {
  const userName = useSelector((state) => state.user.name)
  // STATES
  const [isCommentInputOpen, setIsCommentInputOpen] = useState(false)

  const entitiesToQuery = useMemo(
    () => tasks.map((task) => ({ id: task.id, projectName: task.projectName, type: 'task' })),
    [tasks],
  )
  const entityIds = entitiesToQuery.map((entity) => entity.id)

  const [currentCursor, setCurrentCursor] = useState(null)

  const projectName = selectedTasksProjects[0]
  const entityType = 'task'
  const entityId = tasks[0].id

  const { data: activitiesData = [] } = useGetActivitiesQuery({
    entityIds: entityIds,
    projectName: projectName,
    cursor: currentCursor,
    last: 20,
    currentUser: userName,
    referenceTypes: ['origin', 'mention', 'relation'],
  })

  // get all versions for the task
  const { data: versionsData = [] } = useGetVersionsQuery({
    entities: entitiesToQuery,
  })

  const projectInfo = projectsInfo[projectName]
  // do any transformation on activities data
  // 1. status change activities, attach status data based on projectName
  // 2. reverse the order
  const transformedActivitiesData = useTransformActivities(activitiesData, projectInfo)
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

  // comment mutations here!
  const { submitComment, updateComment, deleteComment } = useCommentMutations({
    projectName,
    entityType,
    entityId,
    entityIds,
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

  const lastActivity = transformedActivitiesData[transformedActivitiesData.length - 1]
  // get cursor of last activity
  const cursor = lastActivity?.cursor
  // get hasPreviousPage of last activity
  const hasPreviousPage = lastActivity?.hasPreviousPage

  const handleGetMoreActivities = () => {
    if (!hasPreviousPage) return console.log('No more activities to load')
    if (!cursor) return console.log('No cursor found')
    console.log('fetching more activities...')
    // get more activities
    setCurrentCursor(cursor)
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
            onUpdate={(value) => updateComment(activity, value)}
            projectInfo={projectInfo}
            projectName={projectName}
            editProps={{
              activeUsers,
              projectName,
              entities: tasks,
              versions: versionsData,
            }}
          />
        ))}
        <InView onChange={(inView) => inView && handleGetMoreActivities()} threshold={1}>
          <Styled.LoadMore style={{ height: 0 }}>
            {hasPreviousPage ? 'Loading more...' : ''}
          </Styled.LoadMore>
        </InView>
      </Styled.FeedContent>
      {!!tasks.length && (
        <CommentInput
          initValue={null}
          onSubmit={submitComment}
          isOpen={isCommentInputOpen}
          onClose={() => setIsCommentInputOpen(false)}
          onOpen={() => setIsCommentInputOpen(true)}
          activeUsers={activeUsers}
          projectName={projectName}
          versions={versionsData}
          entities={tasks}
          projectInfo={projectsInfo[projectName]}
        />
      )}
    </Styled.FeedContainer>
  )
}

export default Feed
