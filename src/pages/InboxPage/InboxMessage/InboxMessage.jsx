import * as Styled from './InboxMessage.styled'
import { classNames } from 'primereact/utils'
import { Icon } from '@ynput/ayon-react-components'
import { isValid } from 'date-fns'
import { isToday } from 'date-fns'
import { format } from 'date-fns'
import UserImage from '/src/components/UserImage'
import InboxMessageStatus from './InboxMessageStatus/InboxMessageStatus'
import { getFuzzyDate } from '/src/components/Feed/ActivityDate'
import { useMemo } from 'react'
import RemoveMarkdown from 'remove-markdown'
import Typography from '/src/theme/typography.module.css'

const getMessageBody = (messages = []) => {
  const unreadMessages = messages.filter((m) => !m.isRead)
  // const messagesToShow = unreadMessages.length > 0 ? unreadMessages : messages
  const messagesToShow = unreadMessages.slice(0, 1)

  return messagesToShow
    .slice()
    .reverse()
    .map((m) => {
      const authorName = m.author?.attrib?.fullName || m.author?.name
      const parsedBody = RemoveMarkdown(m.body)
      const messageBody =
        m.activityType === 'comment' && parsedBody.length > 75
          ? parsedBody.substring(0, 75) + '...'
          : parsedBody
      return `${authorName}: ${messageBody}`
    })
    .join(' > ')
}

const activityTypeIcons = {
  comment: 'chat',
  'version.publish': 'layers',
  'assignee.add': 'person_add',
  'assignee.remove': 'person_remove',
}
const activityTypeIconsMultiple = {
  comment: 'forum',
  'version.publish': activityTypeIcons['version.publish'],
  'assignee.add': 'group_add',
  'assignee.remove': 'group_remove',
}

const getDateString = (date) => {
  const dateObj = new Date(date)
  if (!isValid(dateObj)) return ''

  const today = isToday(dateObj)
  if (today) return getFuzzyDate(dateObj)

  const dateFormat = 'MMM d'

  return format(dateObj, dateFormat)
}

const InboxMessage = ({
  id, // first activity id
  ids = [], // group ids
  messages, // group of messages
  path = [],
  userName,
  type,
  date,
  changes,
  onClear,
  clearLabel = 'Clear',
  clearIcon = 'check',
  isRead,
  unReadCount,
  projectName,
  thumbnail: { icon: thumbnailIcon, url: thumbnailUrl } = {},
  isSelected,
  disableHover, // remove all hover effects
  isPlaceholder, // shimmer effects
  onSelect,
  projectsInfo,
  isMultiple, // are there multiple messages in this group
  ...props
}) => {
  const typeIcon =
    (isMultiple ? activityTypeIconsMultiple[type] : activityTypeIcons[type]) || 'notifications'

  const handleOnClick = (e) => {
    // call the parent onClick if it exists
    props.onClick && props.onClick(e)

    if (onSelect) {
      // check we are not clicking the clear button
      // use closest to check if the clear button is clicked
      if (!e.target.closest('.clear')) {
        onSelect(id, ids)
      }
    }
  }

  const body = useMemo(() => getMessageBody(messages), [])

  let statusChanges = []
  const isStatusChange = type === 'status.change'
  if (isStatusChange) {
    const projectInfo = projectsInfo[projectName]
    if (projectInfo) {
      const statuses = projectInfo.statuses || []
      statusChanges = changes?.map(
        (change) => statuses.find((status) => status.name === change) || {},
      )
    }
  }

  return (
    <Styled.Message
      {...props}
      tabIndex={0}
      className={classNames('inbox-message', {
        isSelected,
        isRead,
        disableHover,
        isPlaceholder,
        isClearable: !!onClear,
      })}
      id={'message-' + id}
      onClick={handleOnClick}
    >
      <Styled.Left className="left">
        <Styled.Thumbnail src={thumbnailUrl} icon={thumbnailIcon} />
        <span className={'title'}>{path.join(' - ')}</span>
      </Styled.Left>
      <Styled.Middle className="middle">
        <Styled.Unread className={classNames(Typography.bodySmall, { hide: unReadCount < 2 })}>
          {unReadCount}
        </Styled.Unread>
        {!isStatusChange && <Icon icon={typeIcon} className="type" />}
        {isStatusChange ? (
          <InboxMessageStatus statuses={statusChanges} />
        ) : (
          <Styled.Body className="body">{body}</Styled.Body>
        )}
      </Styled.Middle>
      <Styled.Right className="right">
        {onClear && (
          <Styled.ClearButton
            id={'clear-' + id}
            icon={clearIcon}
            className="clear"
            variant="filled"
            onClick={onClear && onClear}
          >
            {clearLabel} (c)
          </Styled.ClearButton>
        )}
        <UserImage name={userName} size={20} />
        <Styled.Date className="date">{getDateString(date)}</Styled.Date>
      </Styled.Right>
    </Styled.Message>
  )
}

export default InboxMessage
