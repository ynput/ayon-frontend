// Wrapper around ReportsPage.
// Shows a splash screen with PowerpackDialog when the reports addon is not installed.

import { FC } from 'react'
import ReportsPage from './ReportsPage'
import LoadingPage from '@pages/LoadingPage'
import SplashWrapperPage from '@components/SplashWrapperPage'

interface ProjectReportsPageProps {
  projectName: string
  hasReportsAddon: boolean
  isLoadingAccess: boolean
}

const ProjectReportsPage: FC<ProjectReportsPageProps> = ({
  projectName,
  hasReportsAddon,
  isLoadingAccess,
}) => {
  if (isLoadingAccess) return <LoadingPage />

  if (hasReportsAddon) {
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
