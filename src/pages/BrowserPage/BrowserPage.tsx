import { Splitter, SplitterPanel } from 'primereact/splitter'
import { Section } from '@ynput/ayon-react-components'
import Hierarchy from '@containers/hierarchy'
import TaskList from '@containers/taskList'

import Products from './Products/Products'
import BrowserDetailsPanel from './BrowserDetailsPanel'
import { useVersionUploadContext } from '@containers/VersionUploader/context/VersionUploadContext'
import { FC } from 'react'

const detailsMinWidth = 533
const detailsMaxWidth = '40vw'
const detailsMaxMaxWidth = 700

type BrowserPageProps = {
  projectName: string
}

const BrowserPage: FC<BrowserPageProps> = () => {
  const { onOpenVersionUpload } = useVersionUploadContext()
  return (
    <main style={{ overflow: 'hidden' }}>
      <Splitter
        layout="horizontal"
        style={{ width: '100%', height: '100%' }}
        stateKey="browser-splitter-1"
      >
        <SplitterPanel size={18} style={{ minWidth: 250, maxWidth: 600 }}>
          <Section wrap>
            <Hierarchy onOpenVersionUpload={onOpenVersionUpload} />
            <TaskList style={{ maxHeight: 300 }} />
          </Section>
        </SplitterPanel>
        <SplitterPanel size={82}>
          <Splitter layout="horizontal" style={{ height: '100%' }} stateKey="browser-splitter-2">
            <SplitterPanel style={{ minWidth: 500 }}>
              <Products />
            </SplitterPanel>
            <SplitterPanel
              style={{
                maxWidth: `clamp(${detailsMinWidth}px, ${detailsMaxWidth}, ${detailsMaxMaxWidth}px)`,
                minWidth: detailsMinWidth,
                zIndex: 100,
              }}
            >
              <BrowserDetailsPanel />
            </SplitterPanel>
          </Splitter>
        </SplitterPanel>
      </Splitter>
    </main>
  )
}

const BrowserPageWithProviders: FC<BrowserPageProps> = (props) => {
  return <BrowserPage {...props} />
}

export default BrowserPageWithProviders
