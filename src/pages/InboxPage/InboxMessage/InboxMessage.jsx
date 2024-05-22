import * as Styled from './InboxMessage.styled'
import { classNames } from 'primereact/utils'
import { Button, Icon } from '@ynput/ayon-react-components'
import { isValid } from 'date-fns'
import { isToday } from 'date-fns'
import { format } from 'date-fns'
import UserImage from '/src/components/UserImage'

const activityTypeIcons = {
  comment: 'chat',
  'version.publish': 'layers',
  'status.change': 'arrow_circle_right',
  'assignee.add': 'person_check',
  'assignee.remove': 'person_remove',
}

const getDateString = (date) => {
  const dateObj = new Date(date)
  if (!isValid(dateObj)) return ''

  const today = isToday(dateObj)
  if (today) return 'Today'

  const dateFormat = 'MMM d'

  return format(dateObj, dateFormat)
}

const InboxMessage = ({
  title,
  subTitle,
  userName,
  type,
  body,
  createdAt,
  onClear,
  isRead,
  thumbnail: { icon: thumbnailIcon, url: thumbnailUrl } = {},
  isSelected,
  ...props
}) => {
  const typeIcon = activityTypeIcons[type] || 'notifications'

  return (
    <Styled.Message {...props} tabIndex={0} className={classNames({ isSelected, isRead })}>
      <Styled.Left>
        <Styled.Thumbnail src={thumbnailUrl} icon={thumbnailIcon} />
        <span className={classNames('title')}>{title}</span>
        <span className="sub-title">-</span>
        <span className="sub-title">{subTitle}</span>
      </Styled.Left>
      <Styled.Middle>
        <Icon icon={typeIcon} className="type" />
        <Styled.Body className="body">{body}</Styled.Body>
      </Styled.Middle>
      <Styled.Right>
        <Button icon="check" className="clear" variant="filled" onClick={onClear && onClear}>
          Clear (c)
        </Button>
        <UserImage name={userName} size={20} />
        <Styled.Date className="date">{getDateString(createdAt)}</Styled.Date>
      </Styled.Right>
    </Styled.Message>
  )
}

export default InboxMessage
