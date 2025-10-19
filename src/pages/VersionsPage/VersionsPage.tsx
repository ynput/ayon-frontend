import { FC } from 'react'
import VersionsProviders from './providers'
import { Section } from '@ynput/ayon-react-components'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import Slicer from '@containers/Slicer'
import { useSlicerContext } from '@context/SlicerContext'
import { useSettingsPanel } from '@shared/context'
import {
  useProjectTableContext,
  useSelectedRowsContext,
  useVersionsViewSettings,
} from '@shared/containers'
import VersionsTable from './components/VersionsTable/VersionsTable'
import ProjectOverviewDetailsPanel from '@pages/ProjectOverviewPage/containers/ProjectOverviewDetailsPanel'
import VersionsToolbar from './components/VersionsToolbar/VersionsToolbar'
import VersionsGrid from './components/VersionsGrid/VersionsGrid'

interface VersionsPageProps {
  projectName: string
  children?: React.ReactNode
}

const VersionsPage: FC<VersionsPageProps> = ({ projectName }) => {
  // contexts
  const { isPanelOpen } = useSettingsPanel()
  const { selectedRows } = useSelectedRowsContext()
  const { config } = useSlicerContext()
  const { projectInfo } = useProjectTableContext()
  const { showGrid } = useVersionsViewSettings()
  // load slicer remote config
  const overviewSliceFields = config?.versions?.fields

  // Check if we should show the details panel
  const shouldShowDetailsPanel = selectedRows.length > 0

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
                  gutterSize={!shouldShowDetailsPanel ? 0 : 4}
                >
                  <SplitterPanel size={70}>
                    {showGrid || true ? <VersionsGrid /> : <VersionsTable />}
                  </SplitterPanel>
                  {shouldShowDetailsPanel ? (
                    <SplitterPanel
                      size={30}
                      style={{
                        zIndex: 300,
                        minWidth: 300,
                      }}
                    >
                      <ProjectOverviewDetailsPanel
                        projectInfo={projectInfo}
                        projectName={projectName}
                      />
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
