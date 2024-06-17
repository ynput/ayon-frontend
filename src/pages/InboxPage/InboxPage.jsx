import { useParams } from 'react-router'
import AppNavLinks from '@containers/header/AppNavLinks'
import Inbox from './Inbox/Inbox'
import { useGetInboxUnreadCountQuery } from '@queries/inbox/getInbox'
import { UnreadCount } from './Inbox/Inbox.styled'

const InboxPage = () => {
  const { module } = useParams()

  const { data: importantUnreadCount } = useGetInboxUnreadCountQuery({ important: true })
  const { data: otherUnreadCount } = useGetInboxUnreadCountQuery({ important: false })

  let links = [
    {
      name: 'Important',
      path: '/inbox/important',
      module: 'important',
      endContent: !!importantUnreadCount && (
        <UnreadCount className={'important'}>
          {importantUnreadCount > 99 ? '99+' : importantUnreadCount}
        </UnreadCount>
      ),
      tooltip: 'Activities where you are directly mentioned',
      shortcut: 'I+I',
    },
    {
      name: 'Other',
      path: '/inbox/other',
      module: 'other',
      endContent: !!otherUnreadCount && (
        <UnreadCount>{otherUnreadCount > 99 ? '99+' : otherUnreadCount}</UnreadCount>
      ),
      tooltip: 'Changes to tasks assigned to you or authored by you',
    },
    {
      name: 'Cleared',
      path: '/inbox/cleared',
      module: 'cleared',
    },
  ]

  return (
    <>
      <AppNavLinks links={links} />
      <Inbox filter={module} />
    </>
  )
}

export default InboxPage
