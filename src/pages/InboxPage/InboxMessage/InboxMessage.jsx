import * as Styled from './InboxMessage.styled'
import { classNames } from 'primereact/utils'

const InboxMessage = ({
  id,
  img,
  title,
  subTitle,
  projectName,
  userName,
  type,
  body,
  createdAt,
  onClear,
  isRead,
  isSelected,
  ...props
}) => {
  return (
    <Styled.Message {...props} tabIndex={0} className={classNames({ isSelected })}>
      {title}
    </Styled.Message>
  )
}

export default InboxMessage
