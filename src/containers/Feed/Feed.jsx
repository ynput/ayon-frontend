import React, { useEffect, useMemo, useRef, useState } from 'react'
import ActivityItem from '../../components/Feed/ActivityItem'
import CommentInput from '/src/components/CommentInput/CommentInput'
import * as Styled from './Feed.styled'
import { useGetActivitiesQuery, useGetVersionsQuery } from '/src/services/activities/getActivities'
import useCommentMutations from './hooks/useCommentMutations'
import useTransformActivities from './hooks/useTransformActivities'
import { InView } from 'react-intersection-observer'
import { useDispatch, useSelector } from 'react-redux'
import { onReferenceClick } from '/src/features/dashboard'

const Feed = ({
  entities = [],
  activeUsers,
  projectInfo = {},
  projectName,
  entityType,
  isSlideOut,
}) => {
  const dispatch = useDispatch()
  const userName = useSelector((state) => state.user.name)
  const path = isSlideOut ? 'slideOut' : 'details'
  const activityTypes = useSelector((state) => state.dashboard[path].activityTypes)
  const filter = useSelector((state) => state.dashboard[path].filter)
  // STATES
  const [isCommentInputOpen, setIsCommentInputOpen] = useState(false)

  const entitiesToQuery = useMemo(
    () =>
      entities.map((entity) => ({ id: entity.id, projectName: entity.projectName, entityType })),
    [entities],
  )
  const entityIds = entitiesToQuery.map((entity) => entity.id)

  const [currentCursors, setCurrentCursors] = useState({})

  const entityId = entities[0]?.id

  const {
    data: activitiesData = [],
    isFetching: isFetchingActivities,
    currentData,
  } = useGetActivitiesQuery({
    entityIds: entityIds,
    projectName: projectName,
    cursor: currentCursors[filter],
    last: 20,
    currentUser: userName,
    referenceTypes: ['origin', 'mention', 'relation'],
    activityTypes: activityTypes,
  })

  // get all versions for the entity
  const { data: versionsData = [] } = useGetVersionsQuery({
    entities: entitiesToQuery,
  })

  // TODO: transform versions data into activity data
  const versionActivities = []

  // do any transformation on activities data
  // 1. status change activities, attach status data based on projectName
  // 2. reverse the order
  const transformedActivitiesData = useTransformActivities(activitiesData, projectInfo)

  // TODO: merge in the versions data with the activities data

  // if filter is versions, show only version activities
  const activitiesToShow = filter === 'versions' ? versionActivities : transformedActivitiesData

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
    entityType: entityType,
    entityId,
    entityIds,
    activityTypes,
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

  const lastActivity = activitiesToShow[activitiesToShow.length - 1]
  // get cursor of last activity
  let cursor = lastActivity?.cursor
  // get hasPreviousPage of last activity
  let hasPreviousPage = lastActivity?.hasPreviousPage
  if (lastActivity?.activityType === 'group') {
    const lastGroupActivity = lastActivity.items[lastActivity.items.length - 1]
    cursor = lastGroupActivity?.cursor
    hasPreviousPage = lastGroupActivity?.hasPreviousPage
  }

  const handleGetMoreActivities = () => {
    if (!hasPreviousPage) return console.log('No more activities to load')
    if (!cursor) return console.log('No cursor found')
    console.log('fetching more activities...')
    // get more activities
    setCurrentCursors({ ...currentCursors, [filter]: cursor })
  }

  const handleRefClick = (ref = {}) => {
    const { entityId, entityType, projectName } = ref
    const supportedTypes = ['version', 'task']

    if (!supportedTypes.includes(entityType)) return console.log('Entity type not supported yet')

    if (!entityId || !entityType || !projectName) return console.log('No entity id or type found')

    // open slide out panel
    dispatch(onReferenceClick({ entityId, entityType, projectName }))
  }

  const getRandomNumberBetween = (min = 50, max = 200) => {
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

  const placeholders = useMemo(
    () =>
      new Array(10)
        .fill(0)
        .map((_, index) => (
          <Styled.Placeholder key={index} style={{ minHeight: getRandomNumberBetween() }} />
        )),

    [],
  )

  return (
    <Styled.FeedContainer>
      <Styled.FeedContent ref={feedRef}>
        {isFetchingActivities && !currentData
          ? placeholders
          : activitiesToShow.map((activity) => (
              <ActivityItem
                key={activity.activityId}
                activity={activity}
                onCheckChange={handleCommentChecked}
                onDelete={deleteComment}
                onUpdate={(value) => updateComment(activity, value)}
                projectInfo={projectInfo}
                projectName={projectName}
                entityType={entityType}
                onReferenceClick={handleRefClick}
                isSlideOut={isSlideOut}
                editProps={{
                  activeUsers,
                  projectName,
                  entities: entities,
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
      {!!entities.length && (
        <CommentInput
          initValue={null}
          onSubmit={submitComment}
          isOpen={isCommentInputOpen}
          onClose={() => setIsCommentInputOpen(false)}
          onOpen={() => setIsCommentInputOpen(true)}
          activeUsers={activeUsers}
          projectName={projectName}
          versions={versionsData}
          entities={entities}
          projectInfo={projectInfo}
          filter={filter}
        />
      )}
    </Styled.FeedContainer>
  )
}

export default Feed
