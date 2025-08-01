/**
 * Hook that syncs the hierarchy boolean state to view settings.
 *
 * This hook provides a simple interface for managing the showHierarchy setting
 * that automatically syncs changes to the personal view settings. It uses local
 * state for immediate UI updates and syncs the settings in the background.
 *
 * Must be used within a ViewsProvider context.
 *
 * @returns Object containing:
 *   - showHierarchy: Current hierarchy state (boolean)
 *   - onUpdateHierarchy: Function to update hierarchy state
 *
 * @example
 * ```tsx
 * const { showHierarchy, onUpdateHierarchy } = useHierarchy()
 *
 * // Use in a switch component
 * <SwitchButton
 *   value={showHierarchy}
 *   onClick={() => onUpdateHierarchy(!showHierarchy)}
 *   label="Show hierarchy"
 * />
 * ```
 */

// This hook syncs the hierarchy boolean state to view settings

import { useViewsContext } from '../context/ViewsContext'
import { OverviewSettings, useCreateViewMutation } from '@shared/api'
import { generatePersonalView } from '../utils/generatePersonalView'
import { toast } from 'react-toastify'
import { useState, useEffect } from 'react'

type Return = {
  showHierarchy: boolean
  onUpdateHierarchy: (showHierarchy: boolean) => void
}

export const useHierarchy = (): Return => {
  // this views context is per page/project
  const { viewSettings, viewType, projectName } = useViewsContext()

  // Local state for immediate updates
  const [localHierarchy, setLocalHierarchy] = useState<boolean | null>(null)

  // MUTATIONS
  const [createView] = useCreateViewMutation()

  // Get server hierarchy setting
  const serverHierarchy = (viewSettings as OverviewSettings)?.showHierarchy ?? true

  // Sync local state with server when viewSettings change
  useEffect(() => {
    setLocalHierarchy(null) // Reset local state when server data changes
  }, [JSON.stringify(viewSettings)])

  // Use local state if available, otherwise use server state
  const showHierarchy = localHierarchy !== null ? localHierarchy : serverHierarchy

  const onUpdateHierarchy = async (newShowHierarchy: boolean) => {
    try {
      if (!viewType) throw 'No view type provided for updating hierarchy'

      // Immediately update local state for fast UI response
      setLocalHierarchy(newShowHierarchy)

      // Create settings with updated hierarchy
      const currentSettings = viewSettings as OverviewSettings
      const updatedSettings: OverviewSettings = {
        ...currentSettings,
        showHierarchy: newShowHierarchy,
      }

      // always update the personal view no matter what
      const newPersonalView = generatePersonalView(updatedSettings)

      // Make API call in background
      await createView({
        payload: newPersonalView,
        viewType: viewType,
        projectName: projectName,
      }).unwrap()

      // Clear local state after successful API call - the server data will take over
      setLocalHierarchy(null)
    } catch (error) {
      // Revert local state on error
      setLocalHierarchy(null)
      toast.error(`Failed to update hierarchy setting: ${error}`)
    }
  }

  return {
    showHierarchy,
    onUpdateHierarchy,
  }
}
