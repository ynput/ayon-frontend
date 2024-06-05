import { Link } from 'react-router-dom'
import HeaderButton from './HeaderButton'
import { classNames } from 'primereact/utils'
import { useGetInboxHasUnreadQuery } from '/src/services/inbox/getInbox'
import { useEffect } from 'react'

const InboxNotificationIcon = () => {
  const { data: isNewMessages, refetch } = useGetInboxHasUnreadQuery()

  useEffect(() => {
    refetch() // Check messages immediately on location change

    const interval = setInterval(refetch, 600000) // Check messages every 10 minutes

    const timeout = setTimeout(() => {
      refetch() // Check messages after 10 minutes, even if the location hasn't changed
    }, 600000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
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
