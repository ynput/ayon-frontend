import { useLoadModule } from '@shared/hooks'
import { useSlicerContext, Slicer } from '@shared/containers/Slicer'
import { useAppSelector } from '@state/store'
import { FC } from 'react'
import SchedulerFallback from './SchedulerFallback'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { Section } from '@ynput/ayon-react-components'
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom'

interface SchedulerPageProps {}

const SchedulerPage: FC<SchedulerPageProps> = ({}) => {
  const projectName = (useAppSelector((state) => state.project.name) as null | string) || ''

  // load slicer remote config
  const {
    config,
    sliceType,
    persistentRowSelectionData,
    setPersistentRowSelectionData,
    rowSelectionData,
  } = useSlicerContext()
  const overviewSliceFields = config?.overview?.fields

  const [Scheduler, { isLoaded, outdated }] = useLoadModule({
    addon: 'planner',
    remote: 'planner',
    module: 'Scheduler',
    fallback: SchedulerFallback,
    minVersion: '0.1.0',
  })

  if (outdated) {
    return <div>Scheduler requires Planner addon 0.1.0 or higher</div>
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
          <Scheduler
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

export default SchedulerPage
