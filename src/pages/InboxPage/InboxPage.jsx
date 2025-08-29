import { useParams } from 'react-router-dom'
import AppNavLinks from '@containers/header/AppNavLinks'
import Inbox from './Inbox/Inbox'
import { useGetInboxUnreadCountQuery } from '@queries/inbox/getInbox'
import { UnreadCount } from './Inbox/Inbox.styled'
import DocumentTitle from '@components/DocumentTitle/DocumentTitle'
import useTitle from '@hooks/useTitle'
import HelpButton from '@components/HelpButton/HelpButton'

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
    
    links.push({ node: 'spacer' })
    links.push({
        node: <HelpButton module={`inbox`} />,
    })
  const title = useTitle(module, links, 'AYON', 'Inbox')
    
    return (
    <>
      <DocumentTitle title={title} />
      <AppNavLinks links={links} />
      <Inbox filter={module} />
    </>
  )
}

export default InboxPage
