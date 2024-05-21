import { useParams } from 'react-router'
import AppNavLinks from '/src/containers/header/AppNavLinks'
import Inbox from './Inbox/Inbox'

const InboxPage = () => {
  const { module } = useParams()

  let links = [
    {
      name: 'Important',
      path: '/inbox/important',
      module: 'important',
    },
    {
      name: 'Other',
      path: '/inbox/other',
      module: 'other',
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
