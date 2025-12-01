import { useLoadModule } from '@shared/hooks'
import { useSlicerContext } from '@context/SlicerContext'
import { useAppSelector } from '@state/store'
import { FC, useState, useEffect } from 'react'
import ReportsFallback from './ReportsFallback'
import Slicer from '@containers/Slicer'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { Section } from '@ynput/ayon-react-components'
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { updateViewSettings, useViewsContext, useViewUpdateHelper } from '@shared/containers/Views'
import { ReportsSettings } from '@shared/api'
import { AddonLoadingScreen } from '@shared/components'
import { toast } from 'react-toastify'

interface ReportsPageProps {}

const ReportsPage: FC<ReportsPageProps> = () => {
  const projectName = (useAppSelector((state) => state.project.name) as null | string) || ''
  const [showLoading, setShowLoading] = useState(false)

  const {
    config,
    sliceType,
    persistentRowSelectionData,
    setPersistentRowSelectionData,
    rowSelectionData,
  } = useSlicerContext()
  const overviewSliceFields = config?.overview?.fields

  const viewsContext = useViewsContext()
  const { onCreateView } = useViewUpdateHelper()

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
    return <AddonLoadingScreen />
  }

  return (
    <main style={{ width: '100%', height: '100%' }}>
      <Splitter
        layout="horizontal"
        style={{ width: '100%', height: '100%' }}
        stateKey="overview-splitter-table"
        stateStorage="local"
      >
        <SplitterPanel size={12} minSize={2} style={{ maxWidth: 600 }}>
          <Section wrap>
            <Slicer sliceFields={overviewSliceFields} persistFieldId="hierarchy" />
          </Section>
        </SplitterPanel>
        <SplitterPanel size={80}>
          <Reports
            router={{ ...{ useParams, useNavigate, useLocation, useSearchParams } }}
            projectName={projectName}
            slicer={{
              selection: rowSelectionData,
              type: sliceType,
              persistentRowSelectionData,
              setPersistentRowSelectionData,
            }}
            views={{
              ...viewsContext,
              settings: viewsContext.viewSettings as ReportsSettings,
              updateViewSettings: (...args) =>
                updateViewSettings(...args, viewsContext, onCreateView),
            }}
            toast={toast}
          />
        </SplitterPanel>
      </Splitter>
    </main>
  )
}

export default ReportsPage
