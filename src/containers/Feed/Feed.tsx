import { useMemo, useRef } from 'react'
import ActivityItem from '@components/Feed/ActivityItem'
import CommentInput from '@components/CommentInput/CommentInput'
import * as Styled from './Feed.styled'
import { useGetActivitiesInfiniteInfiniteQuery } from '@queries/activities/getActivities'
import useCommentMutations, { Activity } from './hooks/useCommentMutations'
import useTransformActivities from './hooks/useTransformActivities'
import { InView } from 'react-intersection-observer'
import { useAppSelector } from '@state/store'
import { openSlideOut } from '@state/details'
import useSaveScrollPos from './hooks/useSaveScrollPos'
import useScrollOnInputOpen from './hooks/useScrollOnInputOpen'
import { getLoadingPlaceholders } from './feedHelpers'
import { onCommentImageOpen } from '@state/context'
import { Icon } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { isEqual, union } from 'lodash'
import useScrollToHighlighted from './hooks/useScrollToHighlighted'
import ActivityReferenceTooltip from '@components/Feed/ActivityReferenceTooltip/ActivityReferenceTooltip'
import { isFilePreviewable } from '@containers/FileUploadPreview/FileUploadPreview'
import { useGetKanbanProjectUsersQuery } from '@queries/userDashboard/getUserDashboard'
import EmptyPlaceholder from '@shared/EmptyPlaceholder/EmptyPlaceholder'
import { useFeedContext, FEED_NEW_COMMENT } from '@context/FeedContext'
import { Status } from '@shared/ProjectTreeTable/types/project'

// number of activities to get
export const activitiesLast = 30

export type FeedProps = {
  entities: any[]
  activeUsers: any[]
  projectInfo: any
  projectName: string
  entityType: string
  isMultiProjects: boolean
  readOnly: boolean
  statuses: Status[]
  activityTypes: string[]
  highlighted: string[]
  selectedProjects: string[]
  onOpenSlideOut?: (args: {
    entityId: any
    entityType: any
    projectName: string
    activityId: string
  }) => void
  onOpenImage?: (args: {
    files: any[]
    activityId: string
    index: number
    projectName: string
  }) => void
}

const Feed = ({
  entities = [],
  activeUsers,
  projectInfo = {},
  projectName,
  entityType,
  isMultiProjects,
  readOnly,
  statuses = [],
  activityTypes,
  selectedProjects,
  highlighted = [],
  onOpenSlideOut,
  onOpenImage,
}: FeedProps) => {
  const { editingId, setEditingId, filter, userName } = useFeedContext()

  // hide comment input for specific filters
  const hideCommentInput = ['publishes'].includes(filter)

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
    referenceTypes: ['origin', 'mention', 'relation'],
    activityTypes: activityTypes,
    filter,
  }

  let {
    data: activitiesInfiniteData,
    isLoading: isFetchingActivities,
    isFetchingNextPage,
    currentData,
    fetchNextPage,
    hasNextPage,
  } = useGetActivitiesInfiniteInfiniteQuery(queryArgs, { skip: skip })

  console.log(entities, filter, activityTypes, projectName)

  // Extract tasks from infinite query data correctly
  const activitiesList = useMemo(() => {
    if (!activitiesInfiniteData?.pages) return []
    return activitiesInfiniteData.pages.flatMap((page) => page.activities || [])
  }, [activitiesInfiniteData?.pages])

  const currentActivitiesList = useMemo(() => {
    if (!currentData?.pages) return []
    return currentData.pages.flatMap((page) => page.activities || [])
  }, [currentData?.pages])

  const { data: projectUsers = [] } = useGetKanbanProjectUsersQuery(
    { projects: selectedProjects },
    { skip: !selectedProjects?.length },
  )

  const loadNextPage = async () => {
    if (!hasNextPage) {
      console.log('No more activities to load')
      return undefined
    }
    console.log('loading next page...')
    const result = await fetchNextPage()

    return result
  }

  // check if currentData matches all the entityIds
  // if not, this means we are loading new entity
  const isLoadingNew = useMemo(() => {
    if (!isFetchingActivities) return false

    const currentEntityIds = union(
      currentActivitiesList?.flatMap((activity) => (activity.entityId ? activity.entityId : [])),
    )

    return !isEqual(currentEntityIds, entityIds)
  }, [currentActivitiesList, entityIds, isFetchingActivities])

  if (skip) {
    isFetchingActivities = true
  }

  // do any transformation on activities data
  // 1. status change activities, attach status data based on projectName
  // 2. reverse the order
  // 3. is this activity from the current user?
  const transformedActivitiesData = useTransformActivities(
    activitiesList,
    projectUsers,
    projectInfo,
    entityType,
    userName,
  )

  // REFS
  const feedRef = useRef(null)
  // const commentInputRef = useRef(null)

  // scroll by height of comment input when it opens or closes
  useScrollOnInputOpen({ feedRef, isInputOpen: editingId === FEED_NEW_COMMENT, height: 93 })

  // save scroll position of a feed
  useSaveScrollPos({
    entities,
    feedRef,
    filter,
    disabled: !!highlighted.length,
    isLoading: isLoadingNew,
  })

  // try and scroll to highlighted activity
  useScrollToHighlighted({
    feedRef,
    highlighted,
    isLoading: isLoadingNew,
    loadNextPage,
    hasNextPage,
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
  const handleCommentChecked = (e: React.ChangeEvent<HTMLInputElement>, activity: Activity) => {
    const target = e?.target
    if (!target || !activity) return console.log('no target or activity')

    // the value that it's changing to
    const checked: boolean = target.checked
    const currentMarkdown: string = checked ? '[ ]' : '[x]'
    const newMarkdown: string = checked ? '[x]' : '[ ]'

    const { body } = activity

    // based on all li elements in the whole className 'comment-body' with className 'task-list-item'
    // find the index of the task that was checked
    const taskIndex: number = Array.from(
      target.closest('.comment-body')?.querySelectorAll('.task-list-item') || [],
    ).findIndex((li: Element) => li === target.closest('li'))

    let replaceIndex: number = taskIndex

    // count the number of current markdowns in the body
    const allMarkdowns: string[] = body.match(/\[.\]/g) || []

    allMarkdowns.forEach((markdown: string, index: number) => {
      // does it match the current markdown?
      if (markdown !== currentMarkdown && index < taskIndex) replaceIndex--
    })

    // now find the indexes of the current markdown to replace
    const indexesOfCurrentMarkdownInBody: number[] = []
    let index: number = -1
    while ((index = body.indexOf(currentMarkdown, index + 1)) > -1) {
      indexesOfCurrentMarkdownInBody.push(index)
    }

    const indexToReplaceInBody: number | undefined = indexesOfCurrentMarkdownInBody[replaceIndex]
    if (indexToReplaceInBody === undefined) return

    const endReplaceIndex: number = indexToReplaceInBody + currentMarkdown.length

    // replace the current markdown with the new markdown
    const newBody: string =
      body.slice(0, indexToReplaceInBody) + newMarkdown + body.slice(endReplaceIndex)

    if (!newBody) return

    updateComment(activity, newBody, activity.files)
  }

  const handleRefClick = (ref: { entityId: string; entityType: string; activityId: string }) => {
    const { entityId, entityType, activityId } = ref
    const supportedTypes = ['version', 'task', 'folder']

    if (!entityType || !supportedTypes.includes(entityType))
      return console.log('Entity type not supported yet')

    if (!entityId || !entityType || !projectName) return console.log('No entity id or type found')

    onOpenSlideOut?.({ entityId, entityType, projectName, activityId })
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

    // open image callback
    onOpenImage?.({ files: previewableFiles, activityId, index, projectName })
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
                  onUpdate={async (value, files, refs) =>
                    await updateComment(activity, value, files, refs)
                  }
                  projectInfo={projectInfo}
                  projectName={projectName}
                  entityType={entityType}
                  onReferenceClick={handleRefClick}
                  createdAt={entities.map((e) => e.createdAt)}
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
                  readOnly={readOnly}
                  statuses={statuses}
                />
              ))}
          {/* message when no versions published */}
          {transformedActivitiesData.length === 1 && filter === 'publishes' && !isLoadingNew && (
            <EmptyPlaceholder message="No versions published yet" icon="layers" />
          )}
          {hasNextPage && (
            <InView
              root={feedRef.current}
              onChange={(inView) => inView && loadNextPage()}
              rootMargin={'400px 0px 0px 0px'}
            >
              <Styled.LoadMore style={{ height: 0 }} onClick={() => loadNextPage()}>
                {isFetchingNextPage ? 'Loading more...' : 'Click to load more'}
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
            disabled={isMultiProjects}
            isLoading={isLoadingNew || !entities.length || isSaving}
          />
        )}
      </Styled.FeedContainer>
    </>
  )
}

export default Feed
