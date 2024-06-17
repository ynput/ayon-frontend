import { useEffect } from 'react'
import { useShortcutsContext } from '@context/shortcutsContext'

const useShortcuts = (shortcuts, deps = []) => {
  const { addShortcuts, removeShortcuts } = useShortcutsContext()

  useEffect(() => {
    addShortcuts(shortcuts)
    return () => {
      removeShortcuts(shortcuts)
    }
  }, deps)
}

export default useShortcuts
