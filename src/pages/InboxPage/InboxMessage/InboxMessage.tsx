import * as Styled from './InboxMessage.styled'
import clsx from 'clsx'
import { Icon } from '@ynput/ayon-react-components'
import { format, isToday, isValid } from 'date-fns'

import InboxMessageStatus from './InboxMessageStatus/InboxMessageStatus'
import InboxCategoryDots from './InboxCategoryDots'
import UserImage from '@shared/components/UserImage'
import { getFuzzyDate } from '@shared/containers/Feed/components/ActivityDate'
import { useMemo, MouseEvent, HTMLAttributes } from 'react'
import RemoveMarkdown from 'remove-markdown'
import Typography from '@/theme/typography.module.css'
import { getEntityTypeIcon } from '@shared/util'
import type { InboxMessage as InboxMessageType } from '@/services/inbox/inboxTransform'
import type { InboxActivityType, InboxStatusChange, ProjectsInfo } from '../types'
import type { ProjectsCategories } from '@shared/api'
import { VersionReviewFeedback } from '@shared/containers/Feed/components/CommentInput/types'

interface MessageForBody {
  isRead?: boolean
  author?: {
    name?: string
    attrib?: {
      fullName?: string
    }
  }
  body?: string
  activityType?: string
}

const getMessageBody = (messages: MessageForBody[] = []): string => {
  const unreadMessages = messages.filter((m) => !m.isRead)
  // const messagesToShow = unreadMessages.length > 0 ? unreadMessages : messages
  const messagesToShow = unreadMessages.slice(0, 1)

  return messagesToShow
    .slice()
    .reverse()
    .map((m) => {
      const authorName = m.author?.attrib?.fullName || m.author?.name
      const parsedBody = RemoveMarkdown(m.body || '')
      const messageBody =
        m.activityType === 'comment' && parsedBody.length > 75
          ? parsedBody.substring(0, 75) + '...'
          : parsedBody
      return `${authorName}: ${messageBody}`
    })
    .join(' > ')
}

type ActivityTypeIconResolver = (message: InboxMessageType) => string

const activityTypeIcons: Record<string, string | ActivityTypeIconResolver> = {
  comment: 'chat',
  'version.publish': 'layers',
  'version.review': (message: InboxMessageType) => {
    const data = message.activityData as unknown as { feedback: VersionReviewFeedback }
    switch (data.feedback) {
      case VersionReviewFeedback.APPROVE:
        return 'task_alt'
      case VersionReviewFeedback.REQUEST_CHANGES:
        return 'refresh'
      default:
        return 'forum'
    }
  },
  'assignee.add': 'person_add',
  'assignee.remove': 'person_remove',
  'assignee.reassign': 'swap_horiz',
  reviewable: 'play_circle',
}

const activityTypeIconsMultiple: Record<string, string> = {
  comment: 'forum',
  'version.publish': 'layers',
  'version.review': 'forum',
  'assignee.add': 'group_add',
  'assignee.remove': 'group_remove',
  'assignee.reassign': 'swap_horiz',
}

type ActivityTypeLabelResolver = (message: InboxMessageType) => string

const activityTypeLabels: Record<string, string | ActivityTypeLabelResolver> = {
  comment: 'Comment',
  'version.publish': 'Version published',
  'version.review': (message: InboxMessageType) => {
    const data = message.activityData as unknown as { feedback: VersionReviewFeedback }
    switch (data.feedback) {
      case VersionReviewFeedback.APPROVE:
        return 'Approved'
      case VersionReviewFeedback.REQUEST_CHANGES:
        return 'Changes requested'
      default:
        return 'Review'
    }
  },
  'assignee.add': 'Assigned',
  'assignee.remove': 'Unassigned',
  'assignee.reassign': 'Reassigned',
  reviewable: 'Reviewable uploaded',
}

const activityTypeLabelsMultiple: Record<string, string> = {
  comment: 'Comments',
  'version.publish': 'Versions published',
  'version.review': 'Reviews',
  'assignee.add': 'Assigned',
  'assignee.remove': 'Unassigned',
  'assignee.reassign': 'Reassigned',
  reviewable: 'Versions published',
}

const getDateString = (date: string): string => {
  const dateObj = new Date(date)
  if (!isValid(dateObj)) return ''

  if (isToday(dateObj)) return getFuzzyDate(dateObj)

  return format(dateObj, 'MMM d, h:mm a')
}

const getCategoryNames = (messages: InboxMessageType[] = []): string[] => {
  const names: string[] = []
  for (const message of messages) {
    const data = message.activityData as unknown as { category?: string } | undefined
    if (data?.category && !names.includes(data.category)) names.push(data.category)
  }
  return names
}

interface InboxMessageProps extends Omit<HTMLAttributes<HTMLLIElement>, 'onSelect'> {
  id: string
  ids?: string[]
  messages?: InboxMessageType[]
  path?: string[]
  userName?: string
  type?: InboxActivityType | string
  entityType?: string | null
  entitySubType?: string | null
  entityId?: string | null
  date?: string
  changes?: string[]
  onClear?: () => void
  clearLabel?: string
  clearIcon?: string
  isRead?: boolean
  unReadCount?: number
  projectName?: string
  isSelected?: boolean
  isMultiSelected?: boolean
  disableHover?: boolean
  isPlaceholder?: boolean
  onSelect?: (id: string, ids: string[], e: MouseEvent<HTMLLIElement>, rowIndex?: number) => void
  projectsInfo?: ProjectsInfo
  projectsCategories?: ProjectsCategories
  isMultiple?: boolean
  customBody?: string
  rowIndex: number
}

const InboxMessage = ({
  id, // first activity id
  ids = [], // group ids
  messages, // group of messages
  path = [],
  userName,
  type,
  entityType,
  entitySubType,
  entityId,
  date,
  changes,
  onClear,
  clearLabel = 'Clear',
  clearIcon = 'check',
  isRead,
  unReadCount,
  projectName,
  isSelected,
  isMultiSelected, // part of a selection of more than one row
  disableHover, // remove all hover effects
  isPlaceholder, // shimmer effects
  onSelect,
  projectsInfo = {},
  projectsCategories,
  isMultiple, // are there multiple messages in this group
  customBody, // custom body for special message types (e.g. reassignment)
  rowIndex = 0,
  ...props
}: InboxMessageProps) => {
  const typeIcon = useMemo(() => {
    if (!type || !messages || messages.length === 0) {
      return 'notifications'
    }

    if (isMultiple) {
      return activityTypeIconsMultiple[type]
    }

    const icon = activityTypeIcons[type]
    if (typeof icon === 'function') {
      return icon(messages[0])
    }

    return icon
  }, [type])

  const typeTooltip = useMemo(() => {
    if (!type || !messages || messages.length === 0) return undefined

    if (isMultiple) return activityTypeLabelsMultiple[type]

    const label = activityTypeLabels[type]
    return typeof label === 'function' ? label(messages[0]) : label
  }, [type, messages, isMultiple])

  const iconColor = useMemo(() => {
    if (type !== 'version.review' || !messages || messages.length === 0) {
      return 'inherit'
    }

    const data = messages[0].activityData as unknown as { feedback: VersionReviewFeedback }
    switch (data.feedback) {
      case VersionReviewFeedback.APPROVE:
        return 'var(--md-sys-color-tertiary)'
      case VersionReviewFeedback.REQUEST_CHANGES:
        return 'var(--md-sys-color-error)'
      default:
        return 'inherit'
    }
  }, [messages])

  const handleOnClick = (e: MouseEvent<HTMLLIElement>): void => {
    // call the parent onClick if it exists
    props.onClick && props.onClick(e)

    if (onSelect) {
      // check we are not clicking the clear button
      // use closest to check if the clear button is clicked
      if (!(e.target as HTMLElement).closest('.clear')) {
        onSelect(id, ids, e, rowIndex)
      }
    }
  }

  const body = useMemo<string>(
    () => (customBody ? customBody : getMessageBody(messages as MessageForBody[])),
    [customBody, messages],
  )

  const categories = useMemo(() => {
    const names = getCategoryNames(messages)
    if (!names.length || !projectName) return []
    const known = projectsCategories?.[projectName] || []

    return names
      .map((name) => known.find((category) => category.name === name))
      .filter((category) => !!category)
  }, [messages, projectsCategories, projectName])

  const entityTooltip = useMemo(() => {
    if (!entityType) return undefined
    const label = entityType.charAt(0).toUpperCase() + entityType.slice(1)
    return entitySubType ? `${label}: ${entitySubType}` : label
  }, [entityType, entitySubType])

  let statusChanges: InboxStatusChange[] = []
  const isStatusChange = type === 'status.change'
  if (isStatusChange && projectName) {
    const projectInfo = projectsInfo?.[projectName]
    if (projectInfo) {
      const statuses = (projectInfo.statuses || []) as Array<{
        name: string
        icon?: string
        color?: string
      }>
      statusChanges = (changes?.map(
        (change) => statuses.find((status) => status.name === change) || {},
      ) || []) as InboxStatusChange[]
      // only first and last status
      statusChanges = [statusChanges[0], statusChanges[statusChanges.length - 1]]
    }
  }

  return (
    <Styled.Message
      {...props}
      tabIndex={0}
      className={clsx('inbox-message', {
        isSelected,
        multiSelected: isMultiSelected,
        isRead,
        disableHover,
        placeholder: isPlaceholder,
        clearable: !!onClear,
      })}
      id={'message-' + id}
      onClick={handleOnClick}
    >
      <Styled.Left className="left">
        <Styled.MessageThumbnail
          projectName={projectName}
          entityType={entityType ?? undefined}
          entityId={entityId ?? undefined}
          icon={getEntityTypeIcon(entityType || '')}
          className={clsx({ loading: isPlaceholder })}
          showBorder={false}
          data-tooltip={isPlaceholder ? undefined : entityTooltip}
        />
        <span className={clsx('title', { loading: isPlaceholder })}>{path.join(' - ')}</span>
      </Styled.Left>
      <Styled.Middle className={clsx('middle', { loading: isPlaceholder })}>
        <Styled.Unread className={clsx(Typography.bodySmall, { hide: (unReadCount ?? 0) < 2 })}>
          {unReadCount}
        </Styled.Unread>
        {!isStatusChange && (
          <Icon
            icon={typeIcon}
            className="type"
            style={{ color: iconColor }}
            data-tooltip={typeTooltip}
          />
        )}
        {!isPlaceholder && <InboxCategoryDots categories={categories} />}
        {isStatusChange ? (
          <InboxMessageStatus statuses={statusChanges} />
        ) : (
          <Styled.Body className="body">{body}</Styled.Body>
        )}
      </Styled.Middle>
      <Styled.Right className={clsx('right', { loading: isPlaceholder })}>
        {onClear && (
          <Styled.ClearButton
            id={'clear-' + id}
            icon={clearIcon}
            className="clear"
            variant="filled"
            onClick={onClear}
            shortcut={{ children: 'C' }}
          >
            {clearLabel}
          </Styled.ClearButton>
        )}
        <UserImage name={userName || ''} size={20} className={'n-shimmer'} />
        <Styled.Date className="date">{getDateString(date || '')}</Styled.Date>
      </Styled.Right>
    </Styled.Message>
  )
}

export default InboxMessage
