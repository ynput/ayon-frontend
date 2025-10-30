import { FC } from 'react'
import VersionsProductsPageProviders from './providers'
import { Section } from '@ynput/ayon-react-components'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import Slicer from '@containers/Slicer'
import { useSlicerContext } from '@context/SlicerContext'
import { useSettingsPanel } from '@shared/context'
import VPToolbar from './components/VPToolbar/VPToolbar'
// TABLES
import VPTable from './components/VPTable/VPTable'
import VPGrid from './components/VPGrid/VPGrid'
import VersionsListTable from './components/VersionsListTable/VersionsListTable'

import { useVPViewsContext } from './context/VPViewsContext'
import VPDetailsPanel from './components/VPDetailsPanel/VPDetailsPanel'
import { useVersionsSelectionContext } from './context/VPSelectionContext'
import { VPTableSettings } from './components/VPTableSettings/VPTableSettings'
import { EarlyPreview } from '@shared/components'
import { useVPContextMenu } from './hooks/useVPContextMenu'

interface VersionsProductsPageProps {
  projectName: string
  children?: React.ReactNode
}

const VersionsProductsPage: FC<VersionsProductsPageProps> = ({}) => {
  // contexts
  const { isPanelOpen } = useSettingsPanel()
  const { config } = useSlicerContext()
  const { showGrid } = useVPViewsContext()
  const { showVersionDetails, showVersionsTable } = useVersionsSelectionContext()

  // context menu items
  const contextMenuItems = useVPContextMenu()

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
            <Slicer
              sliceFields={overviewSliceFields}
              persistFieldId="hierarchy"
              entityTypes={['version']}
            />
          </Section>
        </SplitterPanel>
        <SplitterPanel size={88}>
          <Section wrap direction="column" style={{ height: '100%' }}>
            <VPToolbar />
            <Splitter
              layout="horizontal"
              stateKey="overview-splitter-settings"
              stateStorage="local"
              style={{ width: '100%', height: '100%', overflow: 'hidden' }}
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
                    {showGrid ? (
                      <VPGrid contextMenuItems={contextMenuItems} />
                    ) : (
                      <VPTable contextMenuItems={contextMenuItems} />
                    )}
                  </SplitterPanel>
                  {showVersionsTable ? (
                    <SplitterPanel size={15} style={{ minWidth: 100 }}>
                      <VersionsListTable />
                    </SplitterPanel>
                  ) : (
                    <SplitterPanel className="hidden"></SplitterPanel>
                  )}
                  {showVersionDetails ? (
                    <SplitterPanel
                      size={30}
                      style={{
                        zIndex: 300,
                        minWidth: 300,
                      }}
                    >
                      <VPDetailsPanel />
                    </SplitterPanel>
                  ) : (
                    <SplitterPanel className="hidden"></SplitterPanel>
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
                  <VPTableSettings />
                </SplitterPanel>
              ) : (
                <SplitterPanel className="hidden"></SplitterPanel>
              )}
            </Splitter>
          </Section>
        </SplitterPanel>
      </Splitter>
      <EarlyPreview tooltip="The Products page intends to replace the old Browser page. Feedback is greatly appreciated!" />
    </main>
  )
}

// wrap with all the providers
const VersionsProductsPageWithProviders: FC<VersionsProductsPageProps> = ({ projectName }) => (
  <VersionsProductsPageProviders projectName={projectName}>
    <VersionsProductsPage projectName={projectName} />
  </VersionsProductsPageProviders>
)

export default VersionsProductsPageWithProviders
