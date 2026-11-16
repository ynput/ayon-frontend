import React, { useMemo } from 'react'
import * as Styled from './ActivityVersionReview.styled'
import ActivityDate from '../ActivityDate'
import { Icon } from '@ynput/ayon-react-components'
import { VersionReviewFeedback } from '../CommentInput/types'
import { clsx } from 'clsx'
import { UserImage } from '@ynput/ayon-react-components'
import { CategoryTag } from '../ActivityCategorySelect'
import { useCategoryData } from '../../hooks/useCategoryData'
import { getActivityUserName } from '../../helpers/getActivityUserName'
import { getVerbForFeedback, getIconForFeedback } from './ActivityVersionReviewHelpers'
import { useCreateContextMenu } from '@shared/containers/ContextMenu/useCreateContextMenu'
import { useDetailsPanelContext } from '@shared/context'
import { confirmDelete } from '../../../../util'

interface ActivityVersionReviewProps {
  entityType?: string
  isGuest?: boolean
  activity: {
    authorName?: string
    authorFullName?: string
    createdAt?: string
    activityId?: string
    entityId?: string
    isOwner?: boolean
    activityData: {
      feedback: VersionReviewFeedback
      category: string
    }
    [key: string]: any
  }
  onDelete?: (activityId: string, entityId: string, refs: any) => Promise<void>
}

export const ANONYMOUS_GUEST_NAME_PREFIX = "anonymous.guest"

const ActivityVersionReview: React.FC<ActivityVersionReviewProps> = ({
  isGuest,
  activity,
  onDelete,
}) => {
  const {
    authorName,
    authorFullName,
    createdAt,
    activityData,
    activityId,
    entityId,
    isOwner,
    referenceType,
    origin,
  } = activity || {}

  const { user } = useDetailsPanelContext()
  const [contextMenuShow] = useCreateContextMenu()
  // same rule as comments: the author (guests included) or an admin
  const canDelete = !!onDelete && !!activityId && (!!isOwner || !!user?.data?.isAdmin)

  const handleContextMenu = (event: React.MouseEvent) => {
    if (!canDelete) return
    event.preventDefault()
    contextMenuShow(event, [
      {
        label: 'Delete',
        icon: 'delete',
        danger: true,
        command: () =>
          confirmDelete({
            title: 'Delete review',
            message: 'Are you sure you want to delete this review?',
            accept: async () => {
              // a review shown as a reference also has to go from its origin's feed
              const refs =
                referenceType !== 'origin' && origin ? [{ id: origin.id, type: origin.type }] : []
              await onDelete(activityId, entityId ?? '', refs)
            },
          }),
      },
    ])
  }

  const label = useMemo(
    () =>
      [
        getActivityUserName({ name: authorName, label: authorFullName }),
        getVerbForFeedback(activityData?.feedback ?? VersionReviewFeedback.APPROVE),
      ].join(' '),
    [authorFullName, authorName, activityData?.feedback, createdAt],
  )

  const { categoryData, categoryNotFound } = useCategoryData(activityData?.category)

  const userImageSrc = useMemo(() => {
    if (authorName?.startsWith(ANONYMOUS_GUEST_NAME_PREFIX)) {
      return
    }

    return `/api/users/${authorName}/avatar`
  }, [authorName])

  if (!activityData?.feedback) return

  return (
    <Styled.VersionReview
      className={clsx(activityData.feedback, { deletable: canDelete })}
      onContextMenu={handleContextMenu}
    >
      <Styled.Body>
        {authorName && <UserImage
          name={authorName}
          fullName={authorFullName}
          src={userImageSrc}
          size={22}
        />}
        <Icon icon={getIconForFeedback(activityData.feedback)} />
        {categoryData && !isGuest && (
          <CategoryTag
            value={categoryData.name}
            color={categoryData.color}
            isCompact
            data-tooltip={
              categoryNotFound ? 'Category not found. It may have been deleted.' : undefined
            }
            data-tooltip-delay={0}
          />
        )}
        <Styled.Text>{label}</Styled.Text>
        <ActivityDate date={createdAt} exactTooltip />
      </Styled.Body>
    </Styled.VersionReview>
  )
}

export default ActivityVersionReview
