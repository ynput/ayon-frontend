import { useLoadModule } from '@shared/hooks'
import { useSlicerContext } from '@context/SlicerContext'
import { useAppSelector } from '@state/store'
import { FC, useEffect } from 'react'
import ReportsFallback from './ReportsFallback'
import Slicer from '@containers/Slicer'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { Section } from '@ynput/ayon-react-components'
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useReportsViewSettings } from '@shared/containers/Views'

interface ReportsPageProps {}

const ReportsPage: FC<ReportsPageProps> = ({}) => {
  const projectName = (useAppSelector((state) => state.project.name) as null | string) || ''

  // Get view settings from the Views system
  const {
    rowSelection: viewRowSelection,
    onUpdateRowSelection,
    expanded: viewExpanded,
    onUpdateExpanded,
    persistentRowSelectionData: viewPersistentData,
    onUpdatePersistentRowSelectionData,
  } = useReportsViewSettings()

  // load slicer remote config
  const {
    config,
    sliceType,
    persistentRowSelectionData,
    setPersistentRowSelectionData,
    rowSelectionData,
    rowSelection,
    setRowSelection,
    expanded,
    setExpanded,
  } = useSlicerContext()
  const overviewSliceFields = config?.overview?.fields

  // Sync view settings with slicer context on mount and when view settings change
  useEffect(() => {
    if (viewRowSelection && Object.keys(viewRowSelection).length > 0) {
      setRowSelection(viewRowSelection)
    }
    if (viewExpanded && Object.keys(viewExpanded).length > 0) {
      setExpanded(viewExpanded)
    }
    if (viewPersistentData && Object.keys(viewPersistentData).length > 0) {
      setPersistentRowSelectionData(viewPersistentData)
    }
  }, [viewRowSelection, viewExpanded, viewPersistentData, setRowSelection, setExpanded, setPersistentRowSelectionData])

  // Update view settings when slicer context changes
  useEffect(() => {
    if (rowSelection && Object.keys(rowSelection).length > 0) {
      onUpdateRowSelection(rowSelection)
    }
  }, [rowSelection, onUpdateRowSelection])

  useEffect(() => {
    if (expanded && Object.keys(expanded).length > 0) {
      onUpdateExpanded(expanded)
    }
  }, [expanded, onUpdateExpanded])

  useEffect(() => {
    if (persistentRowSelectionData && Object.keys(persistentRowSelectionData).length > 0) {
      onUpdatePersistentRowSelectionData(persistentRowSelectionData)
    }
  }, [persistentRowSelectionData, onUpdatePersistentRowSelectionData])

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
