import { useEffect } from 'react'
import { useShortcutsContext } from '../context/shortcutsContext'

const userShortcuts = (shortcuts) => {
  const { addShortcuts, removeShortcuts } = useShortcutsContext()

  useEffect(() => {
    addShortcuts(shortcuts)
    return () => {
      removeShortcuts(shortcuts)
    }
  }, [])
}

export default userShortcuts
