import { useContext, useEffect } from 'react'
import type { NewEntityType } from '../context/NewEntityContext'
import { MenuContext } from '@shared/context/MenuContext'
import { CellEditingContext } from '@shared/containers/ProjectTreeTable/context/CellEditingContext'

interface EntityOption {
  label: string
  value: string
  type: NewEntityType
  icon: string
  shortcut?: string
  isSequence?: boolean
}

interface UseCreateEntityShortcutsProps {
  options: EntityOption[]
  onOpenNew: (type: NewEntityType, config?: { isSequence?: boolean }) => void
  enabled?: boolean
}

/**
 * Hook to handle keyboard shortcuts for entity creation
 * @param options Array of entity options with shortcut keys
 * @param onOpenNew Callback function to open entity creation dialog
 */
const useCreateEntityShortcuts = ({
  options,
  onOpenNew,
  enabled = true,
}: UseCreateEntityShortcutsProps) => {
  const { menuOpen } = useContext(MenuContext) || { menuOpen: false }
  const { editingCellId } = useContext(CellEditingContext) || { editingCellId: null }
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // skip if the menu is open
      if (menuOpen) return
      // Skip if event target is an input element or contentEditable
      if (
        e.target instanceof HTMLElement &&
        (e.target.tagName === 'INPUT' ||
          e.target.tagName === 'TEXTAREA' ||
          e.target.isContentEditable ||
          e.target.getAttribute('role') === 'textbox')
      ) {
        return
      }

      // skip if currently editing a cell
      if (editingCellId) return

      // Skip if key modifiers are pressed
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return
      }

      // Convert key to uppercase for matching
      const key = e.key.toUpperCase()

      // Find option with matching shortcut
      const option = options.find((opt) => opt.shortcut === key)
      if (option) {
        e.preventDefault()
        onOpenNew(option.type, { isSequence: option.isSequence })
      }
    }

    // Add event listener
    window.addEventListener('keydown', handleKeyDown)

    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, options, onOpenNew, editingCellId, menuOpen])
}

export default useCreateEntityShortcuts
