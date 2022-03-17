import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import ProjectWrapper from '../../containers/project-wrapper'
import Hierarchy from './hierarchy'
import Subsets from './subsets'
import Detail from './detail'
import Breadcrumbs from './breadcrumbs'
import TasksComponent from './tasks'

import { Splitter, SplitterPanel } from 'primereact/splitter'

const BrowserPage = () => {
  const context = useSelector((state) => ({ ...state.contextReducer }))
  const projectName = context.projectName
  const folderTypes = context.project.folderTypes

  const focusedFolders = context.focusedFolders
  const focusedVersions = context.focusedVersions

  // Cache components

  const hierarchy = useMemo(() => {
    return <Hierarchy projectName={projectName} folderTypes={folderTypes} />
  }, [projectName, folderTypes])

  const subsets = useMemo(() => {
    return (
      <Subsets
        projectName={projectName}
        folders={focusedFolders}
        focusedVersions={focusedVersions}
      />
    )
  }, [projectName, focusedFolders, focusedVersions])

  // Return the wrapper

  return (
    <ProjectWrapper>
      <main className="rows">
        <Breadcrumbs />

        <Splitter
          orientation="horizontal"
          stateKey={'browserSplitter'}
          stateStorage={'local'}
          style={{ width: '100%', height: '100%' }}
        >
          <SplitterPanel size={20} style={{ minWidth: 250 }}>
            <section className="invisible insplit">
              <section className="row invisible" style={{ flexGrow: 1 }}>
                {hierarchy}
              </section>
              <section className="row invisible">
                <TasksComponent />
              </section>
            </section>
          </SplitterPanel>
          <SplitterPanel size={60} style={{ minWidth: 500 }}>
            {subsets}
          </SplitterPanel>
          <SplitterPanel size={20}>
            <Detail />
          </SplitterPanel>
        </Splitter>
      </main>
    </ProjectWrapper>
  )
}

export default BrowserPage
