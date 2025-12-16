import * as Styled from './InboxMessage.styled'
import clsx from 'clsx'
import { Icon } from '@ynput/ayon-react-components'
import { isValid } from 'date-fns'
import { isToday } from 'date-fns'
import { format } from 'date-fns'
import UserImage from '@shared/components/UserImage'

import InboxMessageStatus from './InboxMessageStatus/InboxMessageStatus'
import { getFuzzyDate } from '@shared/containers/Feed/components/ActivityDate'
import { useMemo, MouseEvent, HTMLAttributes } from 'react'
import RemoveMarkdown from 'remove-markdown'
import Typography from '@/theme/typography.module.css'
import { getEntityTypeIcon } from '@shared/util'
import type { InboxMessage as InboxMessageType } from '@/services/inbox/inboxTransform'
import type { InboxActivityType, InboxStatusChange, ProjectsInfo } from '../types'

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

const activityTypeIcons: Record<string, string> = {
  comment: 'chat',
  'version.publish': 'layers',
  'assignee.add': 'person_add',
  'assignee.remove': 'person_remove',
  'assignee.reassign': 'swap_horiz',
  reviewable: 'play_circle',
}

const activityTypeIconsMultiple: Record<string, string> = {
  comment: 'forum',
  'version.publish': activityTypeIcons['version.publish'],
  'assignee.add': 'group_add',
  'assignee.remove': 'group_remove',
  'assignee.reassign': 'swap_horiz',
}

const getDateString = (date: string): string => {
  const dateObj = new Date(date)
  if (!isValid(dateObj)) return ''

  const today = isToday(dateObj)
  if (today) return getFuzzyDate(dateObj)

  const dateFormat = 'MMM d'

  return format(dateObj, dateFormat)
}

interface InboxMessageProps extends Omit<HTMLAttributes<HTMLLIElement>, 'onSelect'> {
  id: string
  ids?: string[]
  messages?: InboxMessageType[]
  path?: string[]
  userName?: string
  type?: InboxActivityType | string
  entityType?: string | null
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
  disableHover?: boolean
  isPlaceholder?: boolean
  onSelect?: (id: string, ids: string[]) => void
  projectsInfo?: ProjectsInfo
  isMultiple?: boolean
  customBody?: string
}

const InboxMessage = ({
  id, // first activity id
  ids = [], // group ids
  messages, // group of messages
  path = [],
  userName,
  type,
  entityType,
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
  disableHover, // remove all hover effects
  isPlaceholder, // shimmer effects
  onSelect,
  projectsInfo = {},
  isMultiple, // are there multiple messages in this group
  customBody, // custom body for special message types (e.g. reassignment)
  ...props
}: InboxMessageProps) => {
  const typeIcon =
    (isMultiple && type
      ? activityTypeIconsMultiple[type]
      : type
      ? activityTypeIcons[type]
      : undefined) || 'notifications'

  const handleOnClick = (e: MouseEvent<HTMLLIElement>): void => {
    // call the parent onClick if it exists
    props.onClick && props.onClick(e)

    if (onSelect) {
      // check we are not clicking the clear button
      // use closest to check if the clear button is clicked
      if (!(e.target as HTMLElement).closest('.clear')) {
        onSelect(id, ids)
      }
    }
  }

  const body = useMemo<string>(
    () => (customBody ? customBody : getMessageBody(messages as MessageForBody[])),
    [customBody, messages],
  )

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
        />
        <span className={clsx('title', { loading: isPlaceholder })}>{path.join(' - ')}</span>
      </Styled.Left>
      <Styled.Middle className={clsx('middle', { loading: isPlaceholder })}>
        <Styled.Unread className={clsx(Typography.bodySmall, { hide: (unReadCount ?? 0) < 2 })}>
          {unReadCount}
        </Styled.Unread>
        {!isStatusChange && <Icon icon={typeIcon} className="type" />}
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
