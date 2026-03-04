import { useDispatch } from 'react-redux'
import api from '@shared/api'
import { selectProject as selectProjectContext } from '@state/context'
import { selectProject } from '@state/project'
import { onProjectOpened } from '@state/dashboard'

const useProjectSelectDispatcher = (): Function[] => {
  const dispatch = useDispatch()

  const handleProjectSelectionDispatches = (projectName: string) => {
    // if already on project page, do not navigate
    if (window.location.pathname.split('/')[2] === projectName) return

    // reset selected folders
    dispatch(selectProject(projectName))
    // reset context for projects
    dispatch(selectProjectContext())
    // remove editor query caches
    dispatch(api.util.invalidateTags(['branch', 'workfile', 'hierarchy', 'project', 'product']))
    // set dashboard projects
    dispatch(onProjectOpened(projectName))
  }

  return [handleProjectSelectionDispatches]
}

export { useProjectSelectDispatcher }
