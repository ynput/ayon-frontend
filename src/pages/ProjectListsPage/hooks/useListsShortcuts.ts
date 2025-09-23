import { useEffect } from 'react'
import { useListsContext } from '../context'

const useListsShortcuts = () => {
  const { openNewList, newList, openRenameList } = useListsContext()

  //   open new list with n key shortcut
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // check we are not in an input field or in a classname that contains "block-shortcuts"
      if (
        event.target instanceof HTMLInputElement ||
        (event.target instanceof HTMLElement && event.target.closest('.block-shortcuts'))
      )
        return

      if (event.key === 'n' && !newList) {
        event.preventDefault()
        openNewList()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [newList])
}

export default useListsShortcuts
