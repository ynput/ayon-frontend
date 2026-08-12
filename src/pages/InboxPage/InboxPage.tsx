import { useParams } from 'react-router-dom'
import AppNavLinks from '@containers/header/AppNavLinks'
import Inbox from './Inbox/Inbox'
import { useGetInboxUnreadCountQuery } from '@queries/inbox/getInbox'
import { UnreadCount } from './Inbox/Inbox.styled'
import DocumentTitle from '@components/DocumentTitle/DocumentTitle'
import useTitle from '@hooks/useTitle'
import HelpButton from '@components/HelpButton/HelpButton'
import { WithViews } from '@/hoc/WithViews'
import type { InboxFilter } from './types'
import type { ReactNode } from 'react'

interface InboxLink {
  name?: string
  path?: string
  module?: string
  endContent?: ReactNode
  tooltip?: string
  shortcut?: string
  node?: ReactNode
  viewType?: string
}

// each tab keeps its own saved views: the filters that make sense on Important are not the
// ones you want on Cleared
const getInboxViewType = (module: InboxFilter) => `inbox-${module}`

const InboxPage = () => {
  const { module } = useParams<{ module: InboxFilter }>()
  const activeModule = module || 'important'

  const { data: importantUnreadCount } = useGetInboxUnreadCountQuery({ important: true })
  const { data: otherUnreadCount } = useGetInboxUnreadCountQuery({ important: false })

  // only the active tab renders the views portal, otherwise the empty portal span would
  // nudge the unread counts on the other tabs
  const viewTypeFor = (linkModule: InboxFilter) =>
    linkModule === activeModule ? getInboxViewType(linkModule) : undefined

  const links: InboxLink[] = [
    {
      name: 'Important',
      path: '/inbox/important',
      module: 'important',
      viewType: viewTypeFor('important'),
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
      viewType: viewTypeFor('other'),
      endContent: !!otherUnreadCount && (
        <UnreadCount>{otherUnreadCount > 99 ? '99+' : otherUnreadCount}</UnreadCount>
      ),
      tooltip: 'Changes to tasks assigned to you or authored by you',
    },
    {
      name: 'Cleared',
      path: '/inbox/cleared',
      module: 'cleared',
      viewType: viewTypeFor('cleared'),
    },
  ]

  links.push({ node: 'spacer' })
  links.push({
    node: <HelpButton module={`inbox`} />,
  })
  const title = useTitle(activeModule, links, 'AYON', 'Inbox')

  return (
    <>
      <DocumentTitle title={title} />
      {/* @ts-expect-error - InboxLink is compatible but TypeScript doesn't infer it */}
      <AppNavLinks links={links} />
      <WithViews viewType={getInboxViewType(activeModule)}>
        <Inbox filter={activeModule} />
      </WithViews>
    </>
  )
}

export default InboxPage
