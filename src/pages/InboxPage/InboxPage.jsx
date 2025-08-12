import { useParams } from 'react-router-dom'
import AppNavLinks from '@containers/header/AppNavLinks'
import Inbox from './Inbox/Inbox'
import { useGetInboxUnreadCountQuery } from '@queries/inbox/getInbox'
import { UnreadCount } from './Inbox/Inbox.styled'
import useTitle from '@hooks/useTitle'

const InboxPage = () => {
  const { module } = useParams()
  
  // Get page name based on module
  const getPageName = (module) => {
    switch (module) {
      case 'important': return 'Important'
      case 'other': return 'Other'
      case 'cleared': return 'Cleared'
      default: return 'Inbox'
    }
  }
  
  // Set dynamic title
  useTitle({ page: getPageName(module) })

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
