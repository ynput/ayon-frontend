import React from 'react'
import Menu from '../MenuComponents/Menu'

export const HelpMenu = ({ user, ...props }) => {
  const isUser = user.data.isUser

  const items = [
    {
      id: 'documentation',
      label: 'Documentation',
      link: 'https://ayon.ynput.io/',
      icon: 'description',
    },
    {
      id: 'forum',
      label: 'Community Forum',
      link: 'https://community.ynput.io/',
      icon: 'forum',
    },
    {
      id: 'bug',
      label: 'Report a Bug',
      link: 'https://github.com/ynput/ayon-frontend/issues/new',
      icon: 'bug_report',
    },
    { id: 'divider' },
    {
      id: 'api',
      label: 'REST API',
      link: '/doc/api',
      icon: 'api',
    },
    {
      id: 'graphql',
      label: 'Graphql Explorer',
      link: '/explorer',
      icon: 'hub',
    },
  ]

  const managers = [
    {
      id: 'divider',
    },
    {
      id: 'support',
      label: 'Get Support',
      link: 'https://ynput.io/services',
      icon: 'support_agent',
    },
  ]

  if (!isUser) items.push(...managers)

  return <Menu menu={items} {...props} />
}

export default HelpMenu
