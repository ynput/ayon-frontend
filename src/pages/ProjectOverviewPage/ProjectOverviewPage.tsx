// libraries
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { FC } from 'react'

// state
import { useAppSelector } from '@state/store'
import { useSlicerContext } from '@context/slicerContext'

// containers
import Slicer from '@containers/Slicer'

// arc
import { Section } from '@ynput/ayon-react-components'
import ProjectOverviewMain from './ProjectOverviewMain'
import { $Any } from '@types'

const ProjectOverviewPage: FC = () => {
  const projectName = useAppSelector((state: $Any) => state.project.name) as string

  // load slicer remote config
  const { config } = useSlicerContext()
  const overviewSliceFields = config?.overview?.fields

  return (
    <main style={{ overflow: 'hidden' }}>
      <Splitter
        layout="horizontal"
        style={{ width: '100%', height: '100%' }}
        stateKey="overview-splitter-1"
      >
        <SplitterPanel size={18} style={{ minWidth: 100, maxWidth: 600 }}>
          <Section wrap>
            <Slicer sliceFields={overviewSliceFields} persistFieldId="hierarchy" />
          </Section>
        </SplitterPanel>
        <SplitterPanel size={90}>
          <ProjectOverviewMain projectName={projectName} />
        </SplitterPanel>
      </Splitter>
    </main>
  )
}

export default ProjectOverviewPage
