import useLoadModule from '@/remote/useLoadModule'
import { useSlicerContext } from '@context/slicerContext'
import { useAppSelector } from '@state/store'
import { FC } from 'react'
import SchedulerFallback from './SchedulerFallback'
import Slicer from '@containers/Slicer'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { Section } from '@ynput/ayon-react-components'

interface SchedulerPageProps {}

const SchedulerPage: FC<SchedulerPageProps> = ({}) => {
  const projectName = (useAppSelector((state) => state.project.name) as null | string) || ''

  // load slicer remote config
  const { config, sliceType, persistentRowSelectionData, rowSelectionData } = useSlicerContext()
  const overviewSliceFields = config?.overview?.fields

  const [Scheduler, { isLoaded, outdated }] = useLoadModule({
    addon: 'planner',
    remote: 'planner',
    module: 'Scheduler',
    fallback: SchedulerFallback,
    // minVersion: '0.1.0'
  })

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  return (
    <main>
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
            projectName={projectName}
            slicer={{
              selection: rowSelectionData,
              type: sliceType,
              persistentRowSelectionData,
            }}
          />
        </SplitterPanel>
      </Splitter>
    </main>
  )
}

export default SchedulerPage
