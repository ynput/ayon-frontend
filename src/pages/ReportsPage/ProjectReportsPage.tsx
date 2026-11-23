// The Reports tab without the reports addon's project.page: its legacy page (an older reports
// addon that still exposes the legacy `Reports` module) or the splash screen, which says why the
// page is missing (not installed, not in the bundle, or in the bundle but its page didn't load).

import { FC } from 'react'
import ReportsPage from './ReportsPage'
import LoadingPage from '@pages/LoadingPage'
import SplashWrapperPage from '@components/SplashWrapperPage'
import { useGetBundleAddon } from '@shared/hooks'
import { useRemoteModules } from '@shared/context'

interface ProjectReportsPageProps {
  projectName: string
}

const ProjectReportsPage: FC<ProjectReportsPageProps> = ({ projectName }) => {
  const { getBundleAddonVersion, isLoading } = useGetBundleAddon()
  const { modules } = useRemoteModules()

  if (isLoading) return <LoadingPage />

  // the legacy page only for a reports version that has it; a newer one without its
  // project.page gets the splash's "did not load" notice, not the legacy page's fallback
  const reportsRemote = modules.find((m) => m.addonName === 'reports')
  const hasLegacyPage = !!reportsRemote?.modules.reports?.includes('Reports')

  if (getBundleAddonVersion('reports') && hasLegacyPage) {
    return <ReportsPage projectName={projectName} />
  }

  return (
    <SplashWrapperPage
      label="Reports & Insights"
      splashImage="/splash/reports-splash.png"
      description="Visualize project data with custom charts. Track progress, monitor statuses, and export metrics."
      addon={{ icon: 'analytics', name: 'reports' }}
      features={{
        chartTypes: {
          icon: 'bar_chart',
          bullet: 'Build bar, line, pie, and card charts.',
        },
        timelineTracking: {
          icon: 'timeline',
          bullet: 'Track historical changes and see progress over time.',
        },
        hierarchySlicer: {
          icon: 'filter_list',
          bullet: 'Filter by project hierarchy, assignee, status, or task type.',
        },
        exportReports: {
          icon: 'picture_as_pdf',
          bullet: 'Export custom-branded PDF documents or download raw CSV data.',
        },
        viewsSupport: {
          icon: 'bookmark',
          bullet: 'Create custom dashboards that can be saved and shared with team members.',
        },
      }}
    />
  )
}

export default ProjectReportsPage
