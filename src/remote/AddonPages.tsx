import { ContributionView } from '@ynput/ayon-addon'
import type { Contribution } from '@ynput/ayon-addon'
import {
  useProjectPageSlotContext,
  useStudioPageSlotContext,
} from '@shared/components/AddonLayout/pageSlotContext'
import { useLocalStorage } from '@shared/hooks/useLocalStorage'
import { parseProjectFolderRowId } from '@shared/containers/ProjectsTable'
import { useAppSelector } from '@state/store'
import LoadingPage from '@pages/LoadingPage'
import { useMemo } from 'react'
import { hasPageAccess } from './AddonPagesHelpers'
import { StudioPageSelectionProvider } from './AddonLayout'

// Pages contributed through the project.page and studio.page slots (@ynput/ayon-addon).
// Without access the page renders nothing; AppNavLinks hides its tab and redirects.

const usePageAccess = (contribution: Contribution<'project.page' | 'studio.page'>) => {
  const user = useAppSelector((state) => state.user.data)
  return hasPageAccess(contribution.access, user)
}

export const AddonProjectPage = ({
  contribution,
  projectName,
}: {
  contribution: Contribution<'project.page'>
  projectName: string
}) => {
  // project, slicer selection, project folders and views, from the providers ProjectPage renders
  const context = useProjectPageSlotContext(projectName)
  const allowed = usePageAccess(contribution)

  if (!allowed) return null
  return <ContributionView contribution={contribution} context={context} loading={<LoadingPage />} />
}

export const AddonStudioPage = ({
  contribution,
  onNewProject,
}: {
  contribution: Contribution<'studio.page'>
  onNewProject?: () => void
}) => {
  // each addon studio page keeps its own project selection, for its ProjectList
  const [selection, setSelection] = useLocalStorage<string[]>(
    `dashboard/${contribution.id}/selectedProjects`,
    [],
  )
  const selectedProjects = useMemo(
    () => selection.filter((id) => !parseProjectFolderRowId(id)),
    [selection],
  )
  const context = useStudioPageSlotContext(selectedProjects)
  const studioPage = useMemo(
    () => ({ selection, onSelect: setSelection, onNewProject }),
    [selection, setSelection, onNewProject],
  )
  const allowed = usePageAccess(contribution)

  if (!allowed) return null
  return (
    <StudioPageSelectionProvider value={studioPage}>
      <ContributionView contribution={contribution} context={context} loading={<LoadingPage />} />
    </StudioPageSelectionProvider>
  )
}
