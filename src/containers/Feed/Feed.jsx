import React, { useMemo, useRef, useState } from 'react'
import ActivityItem from '../../components/Feed/ActivityItem'
import CommentInput from '/src/components/CommentInput/CommentInput'
import * as Styled from './Feed.styled'
import {
  allowedVersionsQueryTypes,
  useGetActivitiesQuery,
  useGetVersionsQuery,
} from '/src/services/activities/getActivities'
import useCommentMutations from './hooks/useCommentMutations'
import useTransformActivities from './hooks/useTransformActivities'
import { InView } from 'react-intersection-observer'
import { useDispatch, useSelector } from 'react-redux'
import { openSlideOut } from '/src/features/details'
import useSaveScrollPos from './hooks/useSaveScrollPos'
import useScrollOnInputOpen from './hooks/useScrollOnInputOpen'
import { getLoadingPlaceholders, getNextPage } from './feedHelpers'
import { onCommentImageOpen } from '/src/features/context'
import { Icon } from '@ynput/ayon-react-components'
import { classNames } from 'primereact/utils'
import { useEffect } from 'react'
import { isEqual, union } from 'lodash'

// number of activities to get
export const activitiesLast = 30

const Feed = ({
  entities = [],
  activeUsers,
  projectInfo = {},
  projectName,
  entityType,
  isSlideOut,
  isMultiProjects,
  scope,
}) => {
  const dispatch = useDispatch()
  const userName = useSelector((state) => state.user.name)
  const path = isSlideOut ? 'slideOut' : 'pinned'
  const activityTypes = useSelector((state) => state.details[path].activityTypes)
  const filter = useSelector((state) => state.details[path].filter)

  // STATES
  const [isCommentInputOpen, setIsCommentInputOpen] = useState(false)
  const [currentCursors, setCurrentCursors] = useState({})

  const entitiesToQuery = useMemo(
    () =>
      entities.map((entity) => ({ id: entity.id, projectName: entity.projectName, entityType })),
    [entities],
  )
  const entityIds = entitiesToQuery.map((entity) => entity.id)

  const skip = !entities.length || !filter || !activityTypes || !projectName
  // QUERY MADE TO GET ACTIVITIES
  let {
    data: activitiesData = [],
    isFetching: isFetchingActivities,
    currentData,
  } = useGetActivitiesQuery(
    {
      entityIds: entityIds,
      projectName: projectName,
      cursor: currentCursors[filter],
      last: activitiesLast,
      currentUser: userName,
      referenceTypes: ['origin', 'mention', 'relation'],
      activityTypes: activityTypes,
      filter,
    },
    { skip: skip },
  )

  // check if currentData matches all the entityIds
  // if not, this means we are loading new entity
  const isLoadingNew = useMemo(() => {
    if (!isFetchingActivities) return false

    const currentEntityIds = union(
      currentData?.flatMap((activity) => (activity.entityId ? activity.entityId : [])),
    )

    return !isEqual(currentEntityIds, entityIds)
  }, [currentData, entityIds, isFetchingActivities])

  if (skip) {
    activitiesData = []
    isFetchingActivities = true
  }

  let tasksOrProductsToQuery = []

  if (allowedVersionsQueryTypes.includes(entityType)) {
    // great, we can just use entitiesToQuery already
    tasksOrProductsToQuery = entitiesToQuery
  } else {
    // we need to either use the productId
    tasksOrProductsToQuery = entities.flatMap((entity) =>
      entity.productId
        ? {
            projectName: entity.projectName,
            id: entity.productId,
            entityType: 'product',
          }
        : [],
    )
  }

  // get all versions for the entity
  // used for version mentions (@@)
  const { data: versionsData = [] } = useGetVersionsQuery({
    entities: tasksOrProductsToQuery,
  })

  // do any transformation on activities data
  // 1. status change activities, attach status data based on projectName
  // 2. reverse the order
  const transformedActivitiesData = useTransformActivities(activitiesData, projectInfo, entityType)

  // REFS
  const feedRef = useRef(null)
  // const commentInputRef = useRef(null)

  // scroll by height of comment input when it opens or closes
  useScrollOnInputOpen({ feedRef, isCommentInputOpen, height: 93 })

  // save scroll position of a feed
  useSaveScrollPos({ entities, feedRef, filter })

  // we don't use transformedActivitiesData here because we could get new data from the query
  // but all the activities are merged so transformedActivitiesData doesn't change
  const { cursor, hasPreviousPage } = useMemo(
    () => getNextPage({ activities: transformedActivitiesData }),
    [activitiesData],
  )

  // if there are more activities to fetch but the feed isn't scrollable, fetch more
  useEffect(() => {
    if (!feedRef.current) return
    if (!hasPreviousPage) return
    if (isFetchingActivities) return

    // check if the feed is scrollable
    const isScrollable = feedRef.current.scrollHeight > feedRef.current.clientHeight
    if (isScrollable) return

    console.log('auto fetch more activities...')

    // fetch more activities
    setCurrentCursors({ ...currentCursors, [filter]: cursor })
  }, [feedRef, hasPreviousPage, cursor, filter, currentCursors, isFetchingActivities])

  // comment mutations here!
  const { submitComment, updateComment, deleteComment } = useCommentMutations({
    projectName,
    entityType: entityType,
    entities,
    activityTypes,
    filter,
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

    updateComment(activity, newBody, activity.files)
  }

  // when we scroll to the top of the feed, fetch more activities
  const handleGetMoreActivities = () => {
    // get cursor of last activity and if there is a next page
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
    dispatch(openSlideOut({ entityId, entityType, projectName, scope }))
  }

  const handleFileExpand = (file) => {
    dispatch(onCommentImageOpen({ ...file, projectName }))
  }

  const loadingPlaceholders = useMemo(() => getLoadingPlaceholders(10), [])

  let warningMessage

  // only viewing activities from one project
  if (isMultiProjects)
    warningMessage = `You are only viewing activities from one project: ${projectName}.`

  return (
    <Styled.FeedContainer className="feed">
      {warningMessage && (
        <Styled.Warning>
          <Icon icon="info" />
          {warningMessage}
        </Styled.Warning>
      )}
      <Styled.FeedContent ref={feedRef} className={classNames({ isLoading: isLoadingNew })}>
        {isLoadingNew
          ? loadingPlaceholders
          : transformedActivitiesData.map((activity) => (
              <ActivityItem
                key={activity.activityId}
                activity={activity}
                onCheckChange={handleCommentChecked}
                onDelete={deleteComment}
                onUpdate={(value, files) => updateComment(activity, value, files)}
                projectInfo={projectInfo}
                projectName={projectName}
                entityType={entityType}
                onReferenceClick={handleRefClick}
                isSlideOut={isSlideOut}
                createdAts={entities.map((e) => e.createdAt)}
                onFileExpand={handleFileExpand}
                showOrigin={entities.length > 1}
                filter={filter}
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
        disabled={isMultiProjects}
        isLoading={isLoadingNew || !entities.length}
      />
    </Styled.FeedContainer>
  )
}

export default Feed
