import { useLoadModule } from '@shared/hooks'
import { useSlicerContext } from '@context/SlicerContext'
import { useAppSelector } from '@state/store'
import { FC } from 'react'
import ReportsFallback from './ReportsFallback'
import Slicer from '@containers/Slicer'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { Section } from '@ynput/ayon-react-components'
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom'

interface ReportsPageProps {}

const ReportsPage: FC<ReportsPageProps> = ({}) => {
  const projectName = (useAppSelector((state) => state.project.name) as null | string) || ''

  const {
    config,
    sliceType,
    persistentRowSelectionData,
    setPersistentRowSelectionData,
    rowSelectionData,
  } = useSlicerContext()
  const overviewSliceFields = config?.overview?.fields

  const [Reports, { isLoaded, outdated }] = useLoadModule({
    addon: 'reports',
    remote: 'reports',
    module: 'Reports',
    fallback: ReportsFallback,
    minVersion: '0.1.0-dev',
  })

  if (outdated) {
    return <div>Report requires Report addon 0.1.0 or higher</div>
  }

  if (!isLoaded) {
    return <div>Loading...</div>
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
          />
        </SplitterPanel>
      </Splitter>
    </main>
  )
}

export default ReportsPage
