import { useLoadModule } from '@shared/hooks'
import { useSlicerContext } from '@context/SlicerContext'
import { useAppSelector } from '@state/store'
import { FC } from 'react'
import { Section } from '@ynput/ayon-react-components'
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import Slicer from '@containers/Slicer'

interface ProjectAddonModuleFedProps {
  addonName: string
  addonVersion: string
  sidebar?: string
}

const ProjectAddonModuleFed: FC<ProjectAddonModuleFedProps> = ({ 
  addonName, 
  addonVersion, 
  sidebar 
}) => {
  const projectName = (useAppSelector((state) => state.project.name) as null | string) || ''
  const context = useAppSelector((state) => state.context)
  const userName = useAppSelector((state) => state.user.name)

  // load slicer remote config
  const {
    config,
    sliceType,
    persistentRowSelectionData,
    setPersistentRowSelectionData,
    rowSelectionData,
  } = useSlicerContext()
  const overviewSliceFields = config?.overview?.fields

  // Load the addon component via Module Federation
  const [AddonComponent, { isLoaded, outdated, isLoading }] = useLoadModule<React.ComponentType<any>>({
    addon: addonName,
    remote: addonName, // or specific remote name
    module: 'ProjectAddon', // or whatever the module exports
    fallback: () => <div>Loading {addonName} addon...</div>,
    minVersion: '0.1.0-dev',
  })

  console.log('ProjectAddonModuleFed:', {
    addonName,
    addonVersion,
    isLoaded,
    isLoading,
    outdated,
    AddonComponent: !!AddonComponent
  })

  if (outdated) {
    return <div>{addonName} requires version 0.1.0 or higher</div>
  }

  if (!isLoaded) {
    return <div>Loading {addonName}...</div>
  }

  // For report addon, use the same layout as ReportPage
  if (addonName === 'report') {
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
            <AddonComponent
              router={{ ...{ useParams, useNavigate, useLocation, useSearchParams } }}
              projectName={projectName}
              context={context}
              userName={userName}
              addonName={addonName}
              addonVersion={addonVersion}
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

  // For other addons, use standard layout
  return (
    <main>
      {/* Sidebar component if needed */}
      {sidebar === 'hierarchy' && (
        <div style={{ maxWidth: 500, minWidth: 300 }}>
          {/* Your sidebar component */}
        </div>
      )}
      
      <Section>
        <AddonComponent
          router={{ ...{ useParams, useNavigate, useLocation, useSearchParams } }}
          projectName={projectName}
          context={context}
          userName={userName}
          addonName={addonName}
          addonVersion={addonVersion}
          slicer={{
            selection: rowSelectionData,
            type: sliceType,
            persistentRowSelectionData,
            setPersistentRowSelectionData,
          }}
        />
      </Section>
    </main>
  )
}

export default ProjectAddonModuleFed
