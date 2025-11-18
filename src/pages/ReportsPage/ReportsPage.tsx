import { useLoadModule } from '@shared/hooks'
import { FC, useState, useEffect } from 'react'
import ReportsFallback from './ReportsFallback'
import ReportsLoadingScreen from './ReportsLoadingScreen'
import { ProjectPageRemote } from '@pages/ProjectPage/ProjectPageRemote'

interface ReportsPageProps {
  projectName: string
}

const ReportsPage: FC<ReportsPageProps> = ({ projectName }) => {
  const [showLoading, setShowLoading] = useState(false)

  const [Reports, { isLoaded, outdated }] = useLoadModule({
    addon: 'reports',
    remote: 'reports',
    module: 'Reports',
    fallback: ReportsFallback,
    minVersion: '0.1.0-dev',
  })

  useEffect(() => {
    if (!isLoaded) {
      const timer = setTimeout(() => setShowLoading(true), 200)
      return () => clearTimeout(timer)
    } else {
      setShowLoading(false)
    }
  }, [isLoaded])

  if (outdated) {
    return <div>Report requires Report addon 0.1.0 or higher</div>
  }

  if (!isLoaded && showLoading) {
    return <ReportsLoadingScreen />
  }

  return (
    <ProjectPageRemote
      key={'reports'}
      Component={Reports}
      viewType="reports"
      projectName={projectName}
      slicer={{ fields: ['hierarchy', 'assignees', 'status', 'taskType'] }}
    />
  )
}

export default ReportsPage
