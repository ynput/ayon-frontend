import Hierarchy from '@containers/hierarchy'
import { Section } from '@ynput/ayon-react-components'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { FC } from 'react'

const detailsMinWidth = 533
const detailsMaxWidth = '40vw'
const detailsMaxMaxWidth = 700

const TasksProgressPage: FC = () => {
  return (
    <main style={{ overflow: 'hidden' }}>
      <Splitter
        layout="horizontal"
        style={{ width: '100%', height: '100%' }}
        stateKey="browser-splitter-1"
      >
        <SplitterPanel size={18} style={{ minWidth: 250, maxWidth: 600 }}>
          <Section wrap>
            <Hierarchy />
          </Section>
        </SplitterPanel>
        <SplitterPanel size={82}>
          <Splitter layout="horizontal" style={{ height: '100%' }} stateKey="browser-splitter-2">
            <SplitterPanel style={{ minWidth: 500 }}>Tasks progress</SplitterPanel>
            {/* <SplitterPanel
            style={{
              maxWidth: `clamp(${detailsMinWidth}px, ${detailsMaxWidth}, ${detailsMaxMaxWidth}px)`,
              minWidth: detailsMinWidth,
              zIndex: 100,
            }}
          >
            <BrowserDetailsPanel />
          </SplitterPanel> */}
          </Splitter>
        </SplitterPanel>
      </Splitter>
    </main>
  )
}

export default TasksProgressPage
