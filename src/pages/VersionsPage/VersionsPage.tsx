import { FC } from 'react'
import VersionsProviders from './providers'
import { Section } from '@ynput/ayon-react-components'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import Slicer from '@containers/Slicer'
import { useSlicerContext } from '@context/SlicerContext'
import { useSettingsPanel } from '@shared/context'
import VersionsTable from './components/VersionsTable/VersionsTable'
import VersionsToolbar from './components/VersionsToolbar/VersionsToolbar'
import VersionsGrid from './components/VersionsGrid/VersionsGrid'
import { useVersionsViewsContext } from './context/VersionsViewsContext'
import VersionsDetailsPanel from './components/VersionsDetailsPanel/VersionsDetailsPanel'
import { useVersionsSelectionContext } from './context/VersionsSelectionContext'
import ProductVersionsTable from './components/ProductVersionsTable/ProductVersionsTable'

interface VersionsPageProps {
  projectName: string
  children?: React.ReactNode
}

const VersionsPage: FC<VersionsPageProps> = ({}) => {
  // contexts
  const { isPanelOpen } = useSettingsPanel()
  const { config } = useSlicerContext()
  const { showGrid } = useVersionsViewsContext()
  const { showVersionDetails, showVersionsTable } = useVersionsSelectionContext()

  // load slicer remote config
  const overviewSliceFields = config?.versions?.fields

  return (
    <main style={{ gap: 4 }}>
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
        <SplitterPanel size={88}>
          <Section wrap direction="column" style={{ height: '100%' }}>
            <VersionsToolbar />
            <Splitter
              layout="horizontal"
              stateKey="overview-splitter-settings"
              stateStorage="local"
              style={{ width: '100%', height: '100%', overflow: 'hidden' }}
              gutterSize={!isPanelOpen ? 0 : 4}
            >
              <SplitterPanel size={82}>
                <Splitter
                  layout="horizontal"
                  stateKey="overview-splitter-details"
                  stateStorage="local"
                  style={{ width: '100%', height: '100%' }}
                  gutterSize={!showVersionDetails && !showVersionsTable ? 0 : 4}
                >
                  <SplitterPanel size={70}>
                    {showGrid ? <VersionsGrid /> : <VersionsTable />}
                  </SplitterPanel>
                  {showVersionsTable ? (
                    <SplitterPanel size={15} style={{ minWidth: 100 }}>
                      <ProductVersionsTable />
                    </SplitterPanel>
                  ) : (
                    <SplitterPanel style={{ maxWidth: 0 }}></SplitterPanel>
                  )}
                  {showVersionDetails ? (
                    <SplitterPanel
                      size={30}
                      style={{
                        zIndex: 300,
                        minWidth: 300,
                      }}
                    >
                      <VersionsDetailsPanel />
                    </SplitterPanel>
                  ) : (
                    <SplitterPanel style={{ maxWidth: 0 }}></SplitterPanel>
                  )}
                </Splitter>
              </SplitterPanel>
              {isPanelOpen ? (
                <SplitterPanel
                  size={18}
                  style={{
                    zIndex: 500,
                  }}
                >
                  <div>Versions table settings</div>
                  {/* <ProjectOverviewSettings /> */}
                </SplitterPanel>
              ) : (
                <SplitterPanel style={{ maxWidth: 0 }}></SplitterPanel>
              )}
            </Splitter>
          </Section>
        </SplitterPanel>
      </Splitter>
    </main>
  )
}

// wrap with all the providers
const VersionsPageWithProviders: FC<VersionsPageProps> = ({ projectName }) => (
  <VersionsProviders projectName={projectName}>
    <VersionsPage projectName={projectName} />
  </VersionsProviders>
)

export default VersionsPageWithProviders
