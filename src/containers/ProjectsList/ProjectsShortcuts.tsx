import { FC, useCallback, useEffect } from 'react'
import { useAppSelector } from '@state/store'
import { shouldBlockShortcuts } from '@shared/util'

interface ProjectsShortcutsProps {
  onOpenFolderDialog: () => void
  disabled?: boolean
}

const ProjectsShortcuts: FC<ProjectsShortcutsProps> = ({ onOpenFolderDialog, disabled }) => {
  const viewerOpen = useAppSelector((state) => state.viewer.isOpen)

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (shouldBlockShortcuts(e)) return
      if (viewerOpen) return

      const key = e.key.toLowerCase()
      const isMeta = e.metaKey || e.ctrlKey
      const isShift = e.shiftKey
      const isAlt = e.altKey

      let actionExecuted = false

      // Handle different key combinations
      if (key === 'f' && !isMeta && !isShift && !isAlt) {
        // 'f' - Create folder (powerpack-gated)
        if (disabled) return
        e.preventDefault()
        onOpenFolderDialog()
        actionExecuted = true
      }

      if (actionExecuted) {
        e.stopPropagation()
      }
    },
    [disabled, onOpenFolderDialog, viewerOpen],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress)
    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [handleKeyPress])

  return null
}

export default ProjectsShortcuts
