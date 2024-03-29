import { useMemo } from 'react'
import useShortcuts from '/src/hooks/useShortcuts'

const UserDashboardShortcuts = ({ handleShortcutCollapse, collapsedGroups }) => {
  const shortcuts = useMemo(
    () => [
      {
        key: 'c',
        action: handleShortcutCollapse,
        closest: '.tasks-list',
      },
    ],
    [collapsedGroups],
  )

  useShortcuts(shortcuts, [collapsedGroups])

  return null
}

export default UserDashboardShortcuts
