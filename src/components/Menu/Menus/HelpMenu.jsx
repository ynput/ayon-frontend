import React from 'react'
import MenuContainer from '/src/components/Menu/MenuContainer'
import MenuList from '/src/components/Menu/MenuList'

export const HelpMenu = ({ target }) => {
  const items = [
    {
      id: 'documentation',
      label: 'Documentation',
      url: 'https://ayon.ynput.io/',
      icon: 'description',
      highlighted: true,
    },
    {
      id: 'forum',
      label: 'Community Forum',
      url: 'https://community.ynput.io/',
      icon: 'forum',
    },
    {
      id: 'bug',
      label: 'Report a Bug',
      url: 'https://github.com/ynput/ayon-frontend/issues/new',
      icon: 'bug_report',
    },
    { id: 'divider' },
    {
      id: 'api',
      label: 'REST API',
      url: '/doc/api',
      icon: 'api',
    },
    {
      id: 'graphql',
      label: 'Graphql Explorer',
      url: '/explorer',
      icon: 'hub',
    },
    {
      id: 'divider',
    },
    {
      id: 'support',
      label: 'Get Support',
      url: 'https://ynput.io/services',
      icon: 'support_agent',
    },
  ]

  return (
    <MenuContainer id="help" target={target}>
      <MenuList items={items} />
    </MenuContainer>
  )
}

export default HelpMenu
