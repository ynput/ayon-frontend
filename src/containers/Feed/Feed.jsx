import React, { useMemo, useRef } from 'react'
import ActivityItem from '@components/Feed/ActivityItem'
import CommentInput from '@components/CommentInput/CommentInput'
import * as Styled from './Feed.styled'
import { useGetActivitiesQuery, useLazyGetActivitiesQuery } from '@queries/activities/getActivities'
import useCommentMutations from './hooks/useCommentMutations'
import useTransformActivities from './hooks/useTransformActivities'
import { InView } from 'react-intersection-observer'
import { useDispatch, useSelector } from 'react-redux'
import { openSlideOut } from '@state/details'
import useSaveScrollPos from './hooks/useSaveScrollPos'
import useScrollOnInputOpen from './hooks/useScrollOnInputOpen'
import { getLoadingPlaceholders } from './feedHelpers'
import { onCommentImageOpen } from '@state/context'
import { Icon } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { isEqual, union } from 'lodash'
import useScrollToHighlighted from './hooks/useScrollToHighlighted'
import { toast } from 'react-toastify'
import ActivityReferenceTooltip from '@components/Feed/ActivityReferenceTooltip/ActivityReferenceTooltip'
import { isFilePreviewable } from '@containers/FileUploadPreview/FileUploadPreview'
import { useGetKanbanProjectUsersQuery } from '@queries/userDashboard/getUserDashboard'
import EmptyPlaceholder from '@components/EmptyPlaceholder/EmptyPlaceholder'
import { useFeed, FEED_NEW_COMMENT } from '@context/FeedContext'

// number of activities to get
export const activitiesLast = 30

const Feed = ({
  entities = [],
  activeUsers,
  projectInfo = {},
  projectName,
  entityType,
  isMultiProjects,
  scope = 'dashboard',
  statePath = 'pinned',
  readOnly,
  statuses = [],
}) => {
  const dispatch = useDispatch()
  const { editingId, setEditingId } = useFeed()
  const userName = useSelector((state) => state.user.name)
  const activityTypes = useSelector((state) => state.details[statePath][scope].activityTypes)
  const filter = useSelector((state) => state.details[statePath][scope].filter)
  const highlighted = useSelector((state) => state.details[statePath].highlighted) || []

  // hide comment input for specific filters
  const hideCommentInput = ['publishes'].includes(filter)

  // STATES

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
  const selectedProjects = useSelector((state) => state.dashboard.selectedProjects)
  const { data: projectUsers = [] } = useGetKanbanProjectUsersQuery(
    { projects: selectedProjects },
    { skip: !selectedProjects?.length },
  )

  const { hasPreviousPage, endCursor } = pageInfo
  // when we scroll to the top of the feed, fetch more activities
  const handleLoadMore = async (info) => {
    const endCursorValue = info?.endCursor || endCursor
    const hasPreviousPageValue = info ? info.hasPreviousPage : hasPreviousPage

    console.log(info)

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

  // do any transformation on activities data
  // 1. status change activities, attach status data based on projectName
  // 2. reverse the order
  const transformedActivitiesData = useTransformActivities(
    activitiesData,
    projectUsers,
    projectInfo,
    entityType,
  )

  // REFS
  const feedRef = useRef(null)
  // const commentInputRef = useRef(null)

  // scroll by height of comment input when it opens or closes
  useScrollOnInputOpen({ feedRef, isCommentInputOpen: editingId === FEED_NEW_COMMENT, height: 93 })

  // save scroll position of a feed
  useSaveScrollPos({
    entities,
    feedRef,
    filter,
    disabled: highlighted.length,
    isLoading: isLoadingNew,
  })

  // try and scroll to highlighted activity
  useScrollToHighlighted({
    feedRef,
    highlighted,
    isLoading: isLoadingNew,
    loadMore: handleLoadMore,
    pageInfo,
  })

  // comment mutations here!
  const { submitComment, updateComment, deleteComment, isSaving } = useCommentMutations({
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
    const { entityId, entityType, activityId } = ref
    const supportedTypes = ['version', 'task', 'folder']

    if (!supportedTypes.includes(entityType)) return console.log('Entity type not supported yet')

    if (!entityId || !entityType || !projectName) return console.log('No entity id or type found')

    // open slide out panel
    dispatch(openSlideOut({ entityId, entityType, projectName, scope, activityId }))
  }

  const handleFileExpand = ({ index, activityId }) => {
    const previewableFiles = Object.values(transformedActivitiesData)
      .reverse()
      .filter((a) => a.activityType == 'comment')
      .map((a) => ({
        id: a.activityId,
        files: a.files.filter((file) => isFilePreviewable(file.mime, file.ext)),
      }))
      .filter((a) => a.files.length > 0)
    dispatch(onCommentImageOpen({ files: previewableFiles, activityId, index, projectName }))
  }

  const handleUpdate = async ({activity, value, files, refs}) => {
    // TODO: I seem unable to get `updateComment` to error on invalid input
    await updateComment(activity, value, files, refs)
  }

  const loadingPlaceholders = useMemo(() => getLoadingPlaceholders(10), [])

  let warningMessage

  // only viewing activities from one project
  if (isMultiProjects)
    warningMessage = `You are only viewing activities from one project: ${projectName}.`

  return (
    <>
      <Styled.FeedContainer className="feed">
        {warningMessage && (
          <Styled.Warning>
            <Icon icon="info" />
            {warningMessage}
          </Styled.Warning>
        )}
        <Styled.FeedContent ref={feedRef} className={clsx({ loading: isLoadingNew }, 'no-shimmer')}>
          {isLoadingNew
            ? loadingPlaceholders
            : transformedActivitiesData.map((activity) => (
                <ActivityItem
                  key={activity.activityId}
                  activity={activity}
                  onCheckChange={handleCommentChecked}
                  onDelete={deleteComment}
                  onUpdate={(value, files, refs) => handleUpdate(activity, value, files, refs)}
                  projectInfo={projectInfo}
                  projectName={projectName}
                  entityType={entityType}
                  onReferenceClick={handleRefClick}
                  createdAts={entities.map((e) => e.createdAt)}
                  onFileExpand={handleFileExpand}
                  showOrigin={entities.length > 1}
                  filter={filter}
                  editProps={{
                    activeUsers,
                    projectName,
                    entities: entities,
                    entityType,
                  }}
                  isHighlighted={highlighted.includes(activity.activityId)}
                  dispatch={dispatch}
                  scope={scope}
                  statePath={statePath}
                  readOnly={readOnly}
                  statuses={statuses}
                />
              ))}
          {/* message when no versions published */}
          {transformedActivitiesData.length === 1 && filter === 'publishes' && !isLoadingNew && (
            <EmptyPlaceholder message="No versions published yet" icon="layers" />
          )}
          {hasPreviousPage && (
            <InView
              root={feedRef.current}
              onChange={(inView) => inView && handleLoadMore()}
              rootMargin={'400px 0px 0px 0px'}
            >
              <Styled.LoadMore style={{ height: 0 }} onClick={() => handleLoadMore()}>
                {isFetchingMore ? 'Loading more...' : 'Click to load more'}
              </Styled.LoadMore>
            </InView>
          )}
        </Styled.FeedContent>
        {!hideCommentInput && (
          <CommentInput
            initValue={null}
            onSubmit={submitComment}
            isOpen={editingId === FEED_NEW_COMMENT}
            onClose={() => setEditingId(null)}
            onOpen={() => setEditingId(FEED_NEW_COMMENT)}
            projectName={projectName}
            entities={entities}
            entityType={entityType}
            projectInfo={projectInfo}
            filter={filter}
            disabled={isMultiProjects}
            isLoading={isLoadingNew || !entities.length || isSaving}
            scope={scope}
          />
        )}
      </Styled.FeedContainer>
      <ActivityReferenceTooltip {...{ dispatch, projectName, projectInfo }} />
    </>
  )
}

export default Feed
