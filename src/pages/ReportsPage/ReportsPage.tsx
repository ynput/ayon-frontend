import { useLoadModule } from '@shared/hooks'
import { FC, useState, useEffect } from 'react'
import ReportsFallback from './ReportsFallback'
import { ProjectPageRemote } from '@pages/ProjectPage/ProjectPageRemote'
import { AddonLoadingScreen } from '@shared/components'
import { useSlicerContext } from '@shared/containers'

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

  const { sliceType, persistentRowSelectionData, setPersistentRowSelectionData, rowSelectionData } =
    useSlicerContext()

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
    return <AddonLoadingScreen />
  }

  return (
    <ProjectPageRemote
      key={'reports'}
      Component={Reports}
      projectName={projectName}
      slicer={{ fields: ['hierarchy', 'assignees', 'status', 'taskType'] }}
      addonProps={{
        slicer: {
          selection: rowSelectionData,
          type: sliceType,
          persistentRowSelectionData,
          setPersistentRowSelectionData,
        },
      }}
    />
  )
}

export default ReportsPage
