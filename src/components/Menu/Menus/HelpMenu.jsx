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
      target: '_blank',
    },
    {
      id: 'forum',
      label: 'Community Forum',
      link: 'https://community.ynput.io/',
      icon: 'forum',
      target: '_blank',
    },
    {
      id: 'bug',
      label: 'Report a Bug',
      link: 'https://github.com/ynput/ayon-frontend/issues/new',
      icon: 'bug_report',
      target: '_blank',
    },
    { id: 'divider' },
    {
      id: 'api',
      label: 'REST API',
      link: '/doc/api',
      icon: 'api',
      target: '_blank',
    },
    {
      id: 'graphql',
      label: 'GraphQL Explorer',
      link: '/explorer',
      icon: 'hub',
      target: '_blank',
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
      target: '_blank',
    },
  ]

  if (!isUser) items.push(...managers)

  return <Menu menu={items} {...props} />
}

export default HelpMenu
