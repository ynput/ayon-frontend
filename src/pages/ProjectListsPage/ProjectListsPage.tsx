import { ProjectDataProvider } from '@pages/ProjectOverviewPage/context/ProjectDataContext'
import { useAppSelector } from '@state/store'
import { FC } from 'react'
import { ListsProvider } from './context/ListsContext'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { Section, Toolbar } from '@ynput/ayon-react-components'
import { ListsDataProvider } from './context/ListsDataContext'
import ListsTable from './components/ListsTable/ListsTable'
import ListInfoDialog from './components/ListInfoDialog/ListInfoDialog'
import ListsFiltersDialog from './components/ListsFiltersDialog/ListsFiltersDialog'
import { ListItemsDataProvider } from './context/ListItemsDataContext'
import ListItemsTable from './components/ListItemsTable/ListItemsTable'

const ProjectListsWithProviders: FC = () => {
  const projectName = useAppSelector((state) => state.project.name) || ''
  return (
    <ProjectDataProvider projectName={projectName}>
      <ListsDataProvider>
        <ListsProvider>
          <ListItemsDataProvider>
            <ProjectListsPage />
          </ListItemsDataProvider>
        </ListsProvider>
      </ListsDataProvider>
    </ProjectDataProvider>
  )
}

const ProjectListsPage: FC = () => {
  return (
    <main style={{ overflow: 'hidden', gap: 4 }}>
      <Splitter
        layout="horizontal"
        style={{ width: '100%', height: '100%' }}
        stateKey="overview-splitter-table"
        stateStorage="local"
      >
        <SplitterPanel size={12} minSize={2} style={{ maxWidth: 600 }}>
          <Section wrap>
            <ListsTable />
          </Section>
        </SplitterPanel>
        <SplitterPanel size={88}>
          <Section wrap direction="column" style={{ height: '100%' }}>
            <Toolbar style={{ gap: 8 }}></Toolbar>
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
                >
                  <SplitterPanel size={70}>
                    <ListItemsTable />
                  </SplitterPanel>
                  {!!true ? (
                    <SplitterPanel
                      size={30}
                      style={{
                        zIndex: 300,
                        minWidth: 300,
                      }}
                    >
                      <div>Panel</div>
                    </SplitterPanel>
                  ) : (
                    <SplitterPanel style={{ maxWidth: 0 }}></SplitterPanel>
                  )}
                </Splitter>
              </SplitterPanel>
              {true ? (
                <SplitterPanel
                  size={18}
                  style={{
                    zIndex: 500,
                  }}
                >
                  <div>Table settings</div>
                </SplitterPanel>
              ) : (
                <SplitterPanel style={{ maxWidth: 0 }}></SplitterPanel>
              )}
            </Splitter>
          </Section>
        </SplitterPanel>
      </Splitter>
      <ListInfoDialog />
      <ListsFiltersDialog />
    </main>
  )
}

export default ProjectListsWithProviders
