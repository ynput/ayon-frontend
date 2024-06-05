import { Link } from 'react-router-dom'
import HeaderButton from './HeaderButton'
import { classNames } from 'primereact/utils'
import { useGetInboxHasUnreadQuery } from '/src/services/inbox/getInbox'
import { useEffect } from 'react'
import useNotification from '/src/hooks/useNotification'

const InboxNotificationIcon = () => {
  const { data: isNewMessages, refetch } = useGetInboxHasUnreadQuery()

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

  useEffect(() => {
    refetch() // Check messages immediately on location change

    const interval = setInterval(refetch, 3000) // Check messages every 10 minutes

    return () => {
      clearInterval(interval)
    }
  }, [location.pathname])

  return (
    <Link to="/inbox/important">
      <HeaderButton
        icon="inbox"
        variant="nav"
        className={classNames({ notification: isNewMessages })}
      />
    </Link>
  )
}

export default InboxNotificationIcon
