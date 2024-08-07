import { Link } from 'react-router-dom'
import HeaderButton from './HeaderButton'
import clsx from 'clsx'
import { useGetInboxHasUnreadQuery } from '@queries/inbox/getInbox'

const InboxNotificationIcon = () => {
  const { data: hasUnread } = useGetInboxHasUnreadQuery({})

  return (
    <Link to="/inbox/important">
      <HeaderButton icon="inbox" variant="nav" className={clsx({ notification: hasUnread })} />
    </Link>
  )
}

export default InboxNotificationIcon
