import { ContributionView } from '@ynput/ayon-addon'
import type { Contribution } from '@ynput/ayon-addon'
import { provideHost } from '@ynput/ayon-addon/host'
import { SplitterPanel } from 'primereact/splitter'
import DetailsPanelSplitter from '@components/DetailsPanelSplitter'
import { detailsPanelEntityTypes } from '@shared/api'
import type { DetailsPanelEntityType } from '@shared/api'
import {
  useProjectPageSlotContext,
  useStudioPageSlotContext,
} from '@shared/components/AddonLayout/pageSlotContext'
import { useLocalStorage } from '@shared/hooks/useLocalStorage'
import { parseProjectFolderRowId } from '@shared/containers/ProjectsTable'
import { useAppSelector } from '@state/store'
import LoadingPage from '@pages/LoadingPage'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { hasPageAccess } from './AddonPagesHelpers'
import { StudioPageSelectionProvider } from './AddonLayout'
import { AddonDetailsPanel } from './AddonDetailsPanel'

// Pages contributed through the project.page and studio.page slots (@ynput/ayon-addon).
// Without access the page renders nothing; AppNavLinks hides its tab and redirects.

const usePageAccess = (contribution: Contribution<'project.page' | 'studio.page'>) => {
  const user = useAppSelector((state) => state.user.data)
  return hasPageAccess(contribution.access, user)
}

type ShownEntities = { entityType: DetailsPanelEntityType; entityIds: string[] }

// The details panel next to the page, when the page's description sets `detailsPanel`: the page
// opens it with openDetails (@ynput/ayon-addon), which the host answers while this page is open.
const WithDetailsPanel = ({
  projectName,
  children,
}: {
  projectName: string
  children: React.ReactNode
}) => {
  const [shown, setShown] = useState<ShownEntities | null>(null)
  const close = useCallback(() => setShown(null), [])

  useEffect(() => {
    provideHost({
      openDetails: (entities) => {
        const { entityType, projectName: entitiesProject } = entities[0] ?? {}
        if (
          entitiesProject !== projectName ||
          !detailsPanelEntityTypes.includes(entityType as DetailsPanelEntityType)
        ) {
          return false
        }
        setShown({
          entityType: entityType as DetailsPanelEntityType,
          entityIds: entities.map((entity) => entity.id),
        })
        return true
      },
      closeDetails: close,
    })
    return () => provideHost({ openDetails: undefined, closeDetails: undefined })
  }, [projectName, close])

  return (
    <DetailsPanelSplitter
      layout="horizontal"
      stateKey="addon-page-splitter-details"
      stateStorage="local"
      style={{ width: '100%', height: '100%' }}
    >
      <SplitterPanel size={70}>{children}</SplitterPanel>
      <SplitterPanel size={30} className="details" style={{ zIndex: 300, minWidth: 300 }}>
        {shown && <AddonDetailsPanel projectName={projectName} {...shown} onClose={close} />}
      </SplitterPanel>
    </DetailsPanelSplitter>
  )
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
  const page = (
    <ContributionView contribution={contribution} context={context} loading={<LoadingPage />} />
  )
  return contribution.detailsPanel ? (
    <WithDetailsPanel key={projectName} projectName={projectName}>
      {page}
    </WithDetailsPanel>
  ) : (
    page
  )
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
