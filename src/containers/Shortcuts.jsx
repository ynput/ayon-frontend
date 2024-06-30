// wrapper component for useShortcuts
// prevents the component from re-rendering every time the mouse moves.

import useShortcuts from '@hooks/useShortcuts'

const Shortcuts = ({ shortcuts = [], deps = [] }) => {
  useShortcuts(shortcuts, deps)

  return null
}

export default Shortcuts
