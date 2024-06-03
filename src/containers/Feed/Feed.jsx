import React, { useMemo, useRef, useState } from 'react'
import ActivityItem from '../../components/Feed/ActivityItem'
import CommentInput from '/src/components/CommentInput/CommentInput'
import * as Styled from './Feed.styled'
import {
  useGetActivitiesQuery,
  useLazyGetActivitiesQuery,
} from '/src/services/activities/getActivities'
import useCommentMutations from './hooks/useCommentMutations'
import useTransformActivities from './hooks/useTransformActivities'
import { InView } from 'react-intersection-observer'
import { useDispatch, useSelector } from 'react-redux'
import { openSlideOut } from '/src/features/details'
import useSaveScrollPos from './hooks/useSaveScrollPos'
import useScrollOnInputOpen from './hooks/useScrollOnInputOpen'
import { getLoadingPlaceholders } from './feedHelpers'
import { onCommentImageOpen } from '/src/features/context'
import { Icon } from '@ynput/ayon-react-components'
import { classNames } from 'primereact/utils'
import { isEqual, union } from 'lodash'
import useScrollToHighlighted from './hooks/useScrollToHighlighted'
import { toast } from 'react-toastify'
import { useGetMentionVersionsQuery } from '/src/services/mentions/getMentions'

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
  const highlighted = useSelector((state) => state.details[path].highlighted)

  // STATES
  const [isCommentInputOpen, setIsCommentInputOpen] = useState(false)

  const entitiesToQuery = useMemo(
    () =>
      entities.map((entity) => ({ id: entity.id, projectName: entity.projectName, entityType })),
    [entities],
  )
  const entityIds = entitiesToQuery.map((entity) => entity.id)

  const skip = !entities.length || !filter || !activityTypes || !projectName
  // QUERY MADE TO GET ACTIVITIES

  const queryArgs = {
    entityIds: entityIds,
    projectName: projectName,
    last: activitiesLast,
    currentUser: userName,
    referenceTypes: ['origin', 'mention', 'relation'],
    activityTypes: activityTypes,
    filter,
    cursor: null,
  }

  let {
    data: { activities: activitiesData = [], pageInfo = {} } = {},
    isFetching: isFetchingActivities,
    currentData,
  } = useGetActivitiesQuery(queryArgs, { skip: skip })

  const [getActivitiesData, { isFetching: isFetchingMore }] = useLazyGetActivitiesQuery()

  const { hasPreviousPage, endCursor } = pageInfo
  // when we scroll to the top of the feed, fetch more activities
  const handleLoadMore = async (info) => {
    const endCursorValue = info?.endCursor || endCursor
    const hasPreviousPageValue = info ? info.hasPreviousPage : hasPreviousPage

    // get cursor of last activity and if there is a next page
    if (!hasPreviousPageValue) return console.log('No more activities to load')
    if (!endCursorValue) return console.log('No cursor found')
    console.log('fetching more activities...', endCursorValue)

    try {
      const res = await getActivitiesData({
        ...queryArgs,
        cursor: endCursorValue,
      }).unwrap()
      // return if there is next page to get
      return res?.pageInfo
    } catch (error) {
      console.error(error)
      toast.error('Failed to load more activities')
    }
  }

  // check if currentData matches all the entityIds
  // if not, this means we are loading new entity
  const isLoadingNew = useMemo(() => {
    if (!isFetchingActivities) return false

    const currentEntityIds = union(
      currentData?.activities?.flatMap((activity) => (activity.entityId ? activity.entityId : [])),
    )

    return !isEqual(currentEntityIds, entityIds)
  }, [currentData, entityIds, isFetchingActivities])

  if (skip) {
    activitiesData = []
    isFetchingActivities = true
  }

  let mentionVersionsArgs = { entityType: entityType, entityIds: entityIds }

  const allowedVersionsQueryTypes = ['task', 'product']
  if (!allowedVersionsQueryTypes.includes(entityType)) {
    // we need to either use the productIds as we can't get sibling versions from a version
    mentionVersionsArgs = {
      entityType: 'product',
      entityIds: entities.flatMap((entity) => (entity.productId ? entity.productId : [])),
    }
  }

  // get all versions that can be mentioned
  const { data: mentionVersions = [] } = useGetMentionVersionsQuery({
    entityIds: mentionVersionsArgs.entityIds,
    entityType: mentionVersionsArgs.entityType,
    projectName,
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
  useSaveScrollPos({ entities, feedRef, filter, disabled: highlighted.length })

  // try and scroll to highlighted activity
  useScrollToHighlighted({
    feedRef,
    highlighted,
    isLoading: isLoadingNew,
    loadMore: handleLoadMore,
    pageInfo,
  })

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

  const handleRefClick = (ref = {}) => {
    const { entityId, entityType, projectName, activityId } = ref
    const supportedTypes = ['version', 'task']

    if (!supportedTypes.includes(entityType)) return console.log('Entity type not supported yet')

    if (!entityId || !entityType || !projectName) return console.log('No entity id or type found')

    // open slide out panel
    dispatch(openSlideOut({ entityId, entityType, projectName, scope, activityId }))
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
                  versions: mentionVersions,
                }}
                isHighlighted={highlighted.includes(activity.activityId)}
              />
            ))}
        {hasPreviousPage && (
          <InView
            root={feedRef.current}
            onChange={(inView) => inView && handleLoadMore()}
            rootMargin={'400px 0px 0px 0px'}
          >
            <Styled.LoadMore style={{ height: 0 }} onClick={handleLoadMore}>
              {isFetchingMore ? 'Loading more...' : 'Click to load more'}
            </Styled.LoadMore>
          </InView>
        )}
      </Styled.FeedContent>
      <CommentInput
        initValue={null}
        onSubmit={submitComment}
        isOpen={isCommentInputOpen}
        onClose={() => setIsCommentInputOpen(false)}
        onOpen={() => setIsCommentInputOpen(true)}
        activeUsers={activeUsers}
        projectName={projectName}
        versions={mentionVersions}
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
