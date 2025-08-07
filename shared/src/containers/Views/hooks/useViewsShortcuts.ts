import { useEffect, useCallback } from 'react'
import { toast } from 'react-toastify'
import { useViewsContext } from '../context/ViewsContext'
import { generateWorkingView } from '../utils/generateWorkingView'

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
  const {
    viewType,
    projectName,
    onCreateView,
    setSelectedView,
    workingView,
    isViewWorking,
    onSettingsChanged,
  } = useViewsContext()

  const resetViewToDefault = useCallback(async () => {
    if (!viewType || !projectName) {
      console.warn('Cannot reset view: viewType or projectName not available')
      return
    }

    try {
      // Always create a fresh working view with empty settings
      const freshWorkingView = generateWorkingView({})

      // If we already have a working view, preserve its ID to replace it
      if (workingView?.id) {
        freshWorkingView.id = workingView.id
      }

      // Create/update the working view with empty settings
      await onCreateView(freshWorkingView)

      // If we're not currently on the working view, switch to it and mark settings as changed
      if (!isViewWorking && freshWorkingView.id) {
        setSelectedView(freshWorkingView.id)
        onSettingsChanged(true)
      }

      toast.success('View reset to default settings')
      console.log('View reset to default:', freshWorkingView)
    } catch (error) {
      console.error('Failed to reset view:', error)
      toast.error('Failed to reset view to default')
    }
  }, [
    viewType,
    projectName,
    onCreateView,
    setSelectedView,
    workingView,
    isViewWorking,
    onSettingsChanged,
  ])

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
