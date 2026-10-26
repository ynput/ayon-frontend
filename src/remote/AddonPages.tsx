import { ContributionView } from '@ynput/ayon-addon'
import type { Contribution } from '@ynput/ayon-addon'
import { useGetProjectQuery } from '@shared/api'
import { useAppSelector } from '@state/store'
import LoadingPage from '@pages/LoadingPage'
import { useMemo } from 'react'
import { hasPageAccess } from './AddonPagesHelpers'

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
  // already in the cache: ProjectContextProvider runs the same query
  const { data: project } = useGetProjectQuery({ projectName })
  const context = useMemo(() => ({ projectName, project }), [projectName, project])
  const allowed = usePageAccess(contribution)

  if (!allowed) return null
  return <ContributionView contribution={contribution} context={context} loading={<LoadingPage />} />
}

export const AddonStudioPage = ({ contribution }: { contribution: Contribution<'studio.page'> }) => {
  const context = useMemo(() => ({}), [])
  const allowed = usePageAccess(contribution)

  if (!allowed) return null
  return <ContributionView contribution={contribution} context={context} loading={<LoadingPage />} />
}
