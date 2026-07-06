import { FC, useCallback, useEffect } from 'react'
import { RowSelectionState } from '@tanstack/react-table'
import { ProjectFolderModel } from '@shared/api'
import { shouldBlockShortcuts } from '@shared/util'
import { parseProjectFolderRowId } from './buildProjectsTableData'


interface ProjectsShortcutsProps {
  rowSelection: RowSelectionState
  folders: ProjectFolderModel[]
  onOpenFolderDialog: () => void
  onRenameFolder: (folderId: string) => void
  onRenameProject?: (projectName: string) => void
  disabled?: boolean
}

const ProjectsShortcuts: FC<ProjectsShortcutsProps> = ({
  rowSelection,
  folders,
  onOpenFolderDialog,
  onRenameFolder,
  onRenameProject,
  disabled,
}) => {
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (shouldBlockShortcuts(e)) return

      const key = e.key.toLowerCase()
      const isMeta = e.metaKey || e.ctrlKey
      const isShift = e.shiftKey
      const isAlt = e.altKey

      let actionExecuted = false

      const selectedRowIds = Object.keys(rowSelection)

      const allSelectedRowsAreFolders =
        selectedRowIds.length > 0 &&
        selectedRowIds.every((id) => parseProjectFolderRowId(id))
      const hasMultipleSelected = selectedRowIds.length > 1
      const firstSelectedRow = selectedRowIds[0]

      // Handle different key combinations
      if (key === 'f' && !isMeta && !isShift && !isAlt) {
        // 'f' - Create folder (powerpack-gated)
        if (disabled) return
        e.preventDefault()
        onOpenFolderDialog()
        actionExecuted = true
      } else if (key === 'r' && !isMeta && !isShift && !isAlt) {
        // 'r' - Rename folder (powerpack) OR edit project label (always)
        if (selectedRowIds.length === 0 || hasMultipleSelected) return

        if (allSelectedRowsAreFolders) {
          if (disabled) return
          e.preventDefault()
          const folderId = parseProjectFolderRowId(firstSelectedRow)
          if (folderId) {
            onRenameFolder(folderId)
            actionExecuted = true
          }
        } else if (onRenameProject && !parseProjectFolderRowId(firstSelectedRow)) {
          e.preventDefault()
          onRenameProject(firstSelectedRow)
          actionExecuted = true
        }
      }

      if (actionExecuted) {
        e.stopPropagation()
      }
    },
    [disabled, rowSelection, folders, onOpenFolderDialog, onRenameFolder, onRenameProject],
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
