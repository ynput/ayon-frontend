import { useEffect, useId } from 'react'
import { useShortcutsContext } from '@context/ShortcutsContextInstance'

const useShortcuts = (shortcuts, deps = []) => {
  const { addShortcuts, removeShortcuts } = useShortcutsContext()
  const id = useId()

  useEffect(() => {
    addShortcuts(id, shortcuts)
    return () => {
      removeShortcuts(id)
    }
  }, [id, shortcuts, ...deps])
}

export default useShortcuts
