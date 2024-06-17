import { Link } from 'react-router-dom'
import HeaderButton from './HeaderButton'
import { classNames } from 'primereact/utils'
import { useGetInboxHasUnreadQuery } from '@/services/inbox/getInbox'

const InboxNotificationIcon = () => {
  const { data: hasUnread } = useGetInboxHasUnreadQuery()

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
