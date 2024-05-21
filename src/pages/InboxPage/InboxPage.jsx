import { useMemo } from 'react'
import { useParams } from 'react-router'
import AppNavLinks from '/src/containers/header/AppNavLinks'

const InboxPage = () => {
  const { module } = useParams()

  const moduleComponent = useMemo(() => {
    switch (module) {
      case 'important':
        return 'Important'
      case 'other':
        return 'Other'
      case 'cleared':
        return 'Cleared'
      default:
        return 'Important'
    }
  }, [module])

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
      {moduleComponent}
    </>
  )
}

export default InboxPage
