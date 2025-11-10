import { useEffect } from 'react'
import { NewEntityType } from '@context/NewEntityContext'
import { useMenuContext } from '@shared/context/MenuContext'
import { useCellEditing } from '@shared/containers'

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
}

/**
 * Hook to handle keyboard shortcuts for entity creation
 * @param options Array of entity options with shortcut keys
 * @param onOpenNew Callback function to open entity creation dialog
 */
const useCreateEntityShortcuts = ({ options, onOpenNew }: UseCreateEntityShortcutsProps) => {
  const { menuOpen } = useMenuContext()
  const { editingCellId } = useCellEditing()
  useEffect(() => {
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
  }, [options, onOpenNew, editingCellId])
}

export default useCreateEntityShortcuts
