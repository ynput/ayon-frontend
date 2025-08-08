import { useEffect, useCallback } from 'react'
import { useViewsContext } from '../context/ViewsContext'

/**
 * Hook to handle keyboard shortcuts for Views functionality.
 *
 * Currently provides:
 * - Reset view to default (Shift+Ctrl/Cmd+0) - Resets the working view to empty settings
 *
 * This is intended as a useful feature for quickly resetting view filters and settings.
 * Always operates on the working view only. If not currently on the working view,
 * it will switch to it and mark settings as changed.
 */
export const useViewsShortcuts = () => {
  const { resetWorkingView } = useViewsContext()

  const resetViewToDefault = useCallback(async () => {
    await resetWorkingView()
  }, [resetWorkingView])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if event target is an input element or contentEditable
      if (
        e.target instanceof HTMLElement &&
        (e.target.tagName === 'INPUT' ||
          e.target.tagName === 'TEXTAREA' ||
          e.target.isContentEditable ||
          e.target.getAttribute('role') === 'textbox' ||
          e.target.closest('.block-shortcuts'))
      ) {
        return
      }

      // Reset view shortcut: Shift+Ctrl/Cmd+0 (0 as "reset to zero/default")
      if (e.shiftKey && (e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault()
        resetViewToDefault()
      }
    }

    // Add event listener
    window.addEventListener('keydown', handleKeyDown)

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [resetViewToDefault])

  return {
    resetViewToDefault,
  }
}
