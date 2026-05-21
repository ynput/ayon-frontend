import { useCallback, useEffect, useMemo, useRef } from 'react'
import ActivityItem from './components/ActivityItem'
import CommentInput from './components/CommentInput/CommentInput'
import * as Styled from './Feed.styled'
import useCommentMutations, { Activity } from './hooks/useCommentMutations'
import useTransformActivities from './hooks/useTransformActivities'
import { InView } from 'react-intersection-observer'
import useSaveScrollPos from './hooks/useSaveScrollPos'
import useScrollOnInputOpen from './hooks/useScrollOnInputOpen'
import { getLoadingPlaceholders } from './feedHelpers'
import { Icon } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import useScrollToHighlighted from './hooks/useScrollToHighlighted'
import { isFilePreviewable } from './components/FileUploadPreview/FileUploadPreview'
import EmptyPlaceholder from '@shared/components/EmptyPlaceholder'
import { useFeedContext, FEED_NEW_COMMENT } from './context/FeedContext'
import { Status } from '../ProjectTreeTable/types/project'
import { useDetailsPanelContext, FeedFilter } from '@shared/context'
import { DetailsPanelEntityType, useGetMyProjectPermissionsQuery } from '@shared/api'
import mergeAnnotationAttachments from './helpers/mergeAnnotationAttachments'
import { SavedAnnotationMetadata } from '.'
import TabHeaderAndFilters, {
  FilterItem,
} from '../DetailsPanel/components/TabHeaderAndFilters/TabHeaderAndFilters'

// number of activities to get
export const activitiesLast = 30

const baseFeedFilters: FilterItem<string>[] = [
  {
    id: 'body',
    tooltip: 'Search in comments',
    icon: 'search',
    type: 'search',
    operator: 'like',
    placeholder: 'Search…',
  },
  {
    id: 'comments',
    tooltip: 'Comments',
    icon: 'chat',
  },
  {
    id: 'checklists',
    tooltip: 'Checklists',
    icon: 'checklist',
  },
  {
    id: 'versions',
    tooltip: 'Published versions',
    icon: 'layers',
  },
  {
    id: 'updates',
    tooltip: 'Entity updates',
    icon: 'arrow_circle_right',
  },
  {
    id: 'has_attachments',
    tooltip: 'Has attachments',
    icon: 'attach_file',
  },
]

export type FeedProps = {
  disabled?: boolean
  readOnly: boolean
  statuses: Status[]
  entityListId?: string | undefined
  isSlideOut?: boolean
}

export const Feed = ({
  disabled,
  readOnly,
  statuses = [],
  entityListId,
  isSlideOut,
}: FeedProps) => {
  const {
    projectName,
    entities,
    entityType,
    editingId,
    projectInfo,
    setEditingId,
    userName,
    activitiesData,
    isLoadingNew,
    isLoadingNextPage,
    loadNextPage,
    hasNextPage,
    users,
    categories,
    feedFilter,
    setFeedFilter,
  } = useFeedContext()

  const {
    openSlideOut,
    highlightedActivities,
    setHighlightedActivities,
    onOpenImage,
    setFeedAnnotations,
    user,
  } = useDetailsPanelContext()

  const isVersionsFilter = feedFilter.conditions?.some(
    (c) => 'key' in c && c.key === 'versions' && c.value === true,
  )
  const hasActiveFilters = feedFilter.conditions?.some(
    (c) => 'key' in c && ['comments', 'checklists', 'versions', 'updates'].includes(c.key) && c.value === true,
  )
  const hasCommentLikeFilter = feedFilter.conditions?.some(
    (c) => 'key' in c && (c.key === 'comments' || c.key === 'checklists') && c.value === true,
  )

  const userOptions = useMemo(
    () =>
      users.map((u) => ({
        value: u.name,
        label: u.attrib?.fullName || u.name,
        icon: `/api/users/${u.name}/avatar`,
      })),
    [users],
  )

  const categoryOptions = useMemo(
    () => [
      { value: '__none__', label: 'No category' },
      ...categories.map((cat) => ({
        value: cat.name,
        label: cat.name,
        icon: 'crop_square',
        color: cat.color,
      })),
    ],
    [categories],
  )

  const supportsReviewSession = entityType === 'version' || entityType === 'folder'

  const feedFilters: FilterItem<string>[] = useMemo(
    () => [
      ...baseFeedFilters,
      ...(supportsReviewSession
        ? [
            {
              id: 'in_review_session',
              tooltip: 'In review session',
              icon: 'subscriptions',
            },
          ]
        : []),
      ...(categories.length
        ? [
            {
              id: 'category',
              tooltip: 'Category',
              icon: 'label',
              type: 'enum' as const,
              operator: 'in' as const,
              options: categoryOptions,
            },
          ]
        : []),
      {
        id: 'author',
        tooltip: 'User (author or assignee)',
        icon: 'person',
        type: 'enum',
        operator: 'in',
        options: userOptions,
      },
    ],
    [userOptions, supportsReviewSession, categories.length, categoryOptions],
  )

  // check activities permission for commenting
  const {
    data: projectPermissions,
    isLoading: isLoadingPermissions,
  } = useGetMyProjectPermissionsQuery(
    { projectName },
    { skip: !projectName },
  )
  const isCommentRestricted =
    !user.data?.isManager &&
    !user.data?.isAdmin &&
    !isLoadingPermissions &&
    projectPermissions?.activities?.enabled &&
    !projectPermissions?.activities?.activities?.includes('comment')

  // hide comment input for specific filters or when restricted by permissions
  const hideCommentInput = isCommentRestricted || (hasActiveFilters && !hasCommentLikeFilter)

  const activitiesWithMergedAnnotations = useMemo(
    () => mergeAnnotationAttachments(activitiesData),
    [activitiesData],
  )

  useEffect(() => {
    if (!activitiesWithMergedAnnotations.length) {
      setFeedAnnotations([])
    }

    const annotations = activitiesWithMergedAnnotations
      .map((activity) =>
        activity.activityData?.annotations?.map((a: SavedAnnotationMetadata) => ({
          ...a,
          activityId: activity.activityId,
        })),
      )
      .filter(Boolean)
      .flat()

    setFeedAnnotations(annotations)
  }, [activitiesWithMergedAnnotations])

  // do any transformation on activities data
  // 1. status change activities, attach status data based on projectName
  // 2. reverse the order
  // 3. is this activity from the current user?
  const transformedActivitiesData = useTransformActivities(
    // @ts-ignore
    activitiesWithMergedAnnotations,
    users,
    projectInfo,
    entityType,
    userName,
    feedFilter,
  ) as any[]

  // REFS
  const feedRef = useRef(null)
  // const commentInputRef = useRef(null)

  // scroll by height of comment input when it opens or closes
  useScrollOnInputOpen({ feedRef, isInputOpen: editingId === FEED_NEW_COMMENT, height: 93 })

  // save scroll position of a feed
  useSaveScrollPos({
    entities,
    feedRef,
    filter: feedFilter,
    disabled: !!highlightedActivities.length,
    isLoading: isLoadingNew,
  })
  // try and scroll to highlightedActivities activity
  useScrollToHighlighted({
    feedRef,
    highlighted: highlightedActivities,
    isLoading: isLoadingNew || isLoadingNextPage,
    loadNextPage,
    hasNextPage: !!loadNextPage,
    activities: activitiesData,
  })

  // comment mutations here!
  const {
    submitComment: submitCommentMutation,
    updateComment,
    deleteComment,
    isSaving,
  } = useCommentMutations({
    projectName,
    entityType: entityType,
    entities,
    filter: feedFilter,
    entityListId,
  })

  // wrap submitComment to scroll to bottom
  const submitComment = useCallback(
    async (value: string, files: any[] = [], data: any = {}) => {
      await submitCommentMutation(value, files, data)
      // scroll to bottom (scrollTop 0 is bottom because of column-reverse)
      if (feedRef.current) {
        ;(feedRef.current as any).scrollTo({ top: 0 })
      }
    },
    [submitCommentMutation, feedRef],
  )

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

  const handleRefClick = (ref: {
    entityId: string
    entityType: DetailsPanelEntityType
    activityId: string
  }) => {
    const { entityId, entityType, activityId } = ref
    const supportedTypes = ['version', 'task', 'folder']

    if (!entityType || !supportedTypes.includes(entityType))
      return console.log('Entity type not supported yet')

    if (!entityId || !entityType || !projectName) return console.log('No entity id or type found')

    // open the slide out
    openSlideOut({ entityId, entityType, projectName })
    // set highlighted activity
    setHighlightedActivities([activityId])
  }

  const handleFileExpand = ({ index, activityId }: { index: number; activityId: string }) => {
    const previewableFiles = Object.values(transformedActivitiesData)
      .reverse()
      .filter((a) => a.activityType == 'comment')
      .map((a) => ({
        id: a.activityId,
        files: a.files.filter((file: any) => isFilePreviewable(file.mime, file.ext)),
      }))
      .filter((a) => a.files.length > 0)

    // open image callback
    onOpenImage?.({ files: previewableFiles, activityId, index, projectName })
  }

  const loadingPlaceholders = useMemo(() => getLoadingPlaceholders(10), [])

  let warningMessage

  return (
    <>
      <Styled.FeedContainer className="feed">
        {warningMessage && (
          <Styled.Warning>
            <Icon icon="info" />
            {warningMessage}
          </Styled.Warning>
        )}
        <TabHeaderAndFilters<FeedFilter>
          filters={feedFilters}
          currentFilter={feedFilter}
          onFilterChange={setFeedFilter}
          isLoading={isLoadingNew}
        />
        <Styled.FeedContent ref={feedRef} className={clsx({ loading: isLoadingNew }, 'no-shimmer')}>
          {isLoadingNew
            ? loadingPlaceholders
            : transformedActivitiesData.map((activity) => (
                <ActivityItem
                  key={activity.activityId}
                  activity={activity}
                  onCheckChange={handleCommentChecked}
                  onDelete={deleteComment}
                  onUpdate={async (value, files, _refs, data) =>
                    await updateComment(activity, value, files, data)
                  }
                  projectInfo={projectInfo}
                  projectName={projectName}
                  entityType={entityType}
                  onReferenceClick={handleRefClick}
                  createdAts={entities.map((e) => e.createdAt)}
                  onFileExpand={handleFileExpand}
                  showOrigin={entities.length > 1}
                  filter={feedFilter}
                  editProps={{
                    projectName,
                    entities: entities,
                    entityType,
                  }}
                  isHighlighted={highlightedActivities.includes(activity.activityId)}
                  readOnly={readOnly}
                  statuses={statuses}
                  isSlideOut={isSlideOut}
                />
              ))}
          {/* message when no versions published */}
          {transformedActivitiesData.length === 0 &&
            isVersionsFilter &&
            !hasCommentLikeFilter &&
            !isLoadingNew && (
            <EmptyPlaceholder message="No versions published yet" icon="layers" />
          )}
          {transformedActivitiesData.length === 0 &&
            !isVersionsFilter &&
            (feedFilter.conditions?.length ?? 0) > 0 &&
            !isLoadingNew && (
              <EmptyPlaceholder message="No activities match your filters" icon="search_off" />
          )}
          {hasNextPage && loadNextPage && (
            <InView
              root={feedRef.current}
              onChange={(inView) => inView && loadNextPage()}
              rootMargin={'400px 0px 0px 0px'}
            >
              <Styled.LoadMore style={{ height: 0 }} onClick={() => loadNextPage()}>
                {isLoadingNextPage ? 'Loading more...' : 'Click to load more'}
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
            disabled={disabled}
            isLoading={isLoadingNew || !entities.length || isSaving}
          />
        )}
      </Styled.FeedContainer>
    </>
  )
}
