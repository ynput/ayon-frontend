import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '@state/store'
import { useProjectSelectDispatcher } from '@containers/ProjectMenu/hooks/useProjectSelectDispatcher'
import { useProjectDefaultTab } from '@hooks/useProjectDefaultTab'
import useUserProjectPermissions from '@hooks/useUserProjectPermissions'

/**
 * What the app adds to the shared project list (ProjectsList, useProjectMenuController): opening
 * and managing a project (routes, store), the permission to create projects, and pausing the
 * list's shortcuts while the viewer is open.
 */
export const useProjectsListAppProps = () => {
  const navigate = useNavigate()
  const { getDefaultTab } = useProjectDefaultTab()
  const [handleProjectSelectionDispatches] = useProjectSelectDispatcher()
  const { isLoading, permissions } = useUserProjectPermissions(true)
  const viewerOpen = useAppSelector((state) => state.viewer.isOpen)

  const onOpenProject = useCallback(
    (project: string) => {
      handleProjectSelectionDispatches(project)
      navigate(`/projects/${project}/${getDefaultTab()}`)
    },
    [getDefaultTab, handleProjectSelectionDispatches, navigate],
  )

  const onManageProject = useCallback(
    (project: string) => navigate(`/manageProjects/anatomy?project=${project}`),
    [navigate],
  )

  return {
    onOpenProject,
    onManageProject,
    canCreateProject: !isLoading && !!permissions?.canCreateProject(),
    shortcutsPaused: viewerOpen,
  }
}
