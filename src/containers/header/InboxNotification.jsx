import { Link } from 'react-router-dom'
import HeaderButton from './HeaderButton'
import { classNames } from 'primereact/utils'
import { useGetInboxHasUnreadQuery } from '/src/services/inbox/getInbox'
import useNotification from '/src/hooks/useNotification'
import { useSelector } from 'react-redux'

const InboxNotificationIcon = () => {
  const user = useSelector((state) => state.user)
  const { data: hasUnread } = useGetInboxHasUnreadQuery({ skip: !user })

  const sendNotification = useNotification()

  // TODO: send a desktop notification when there are unread messages
  // eslint-disable-next-line no-unused-vars
  const sendInboxNotification = async () => {
    // check if the user has granted permission to send notifications
    if (Notification.permission !== 'granted') return
    sendNotification(
      'New AYON message',
      'You have unread messages in your inbox',
      '/inbox/important',
    )
  }

  return (
    <Link to="/inbox/important">
      <HeaderButton
        icon="inbox"
        variant="nav"
        className={classNames({ notification: hasUnread })}
      />
    </Link>
  )
}

export default InboxNotificationIcon
