import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import Hierarchy from './hierarchy'
import Subsets from './subsets'
import Detail from './detail'
import TasksPanel from './tasks'

import { Splitter, SplitterPanel } from 'primereact/splitter'

const BrowserPage = () => {
  const context = useSelector((state) => ({ ...state.context }))
  const projectName = context.projectName
  const folderTypes = context.project.folderTypes
  const focusedFolders = context.focusedFolders
  const focusedVersions = context.focusedVersions
  const selectedVersions = context.selectedVersions

  console.log('Selected versions:', selectedVersions)

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
        selectedVersions={selectedVersions}
      />
    )
  }, [projectName, focusedFolders, focusedVersions, selectedVersions])

  // Return the wrapper

  return (
    <main>
      <Splitter
        orientation="horizontal"
        stateKey={'browserSplitter'}
        stateStorage={'local'}
        style={{ width: '100%', height: '100%' }}
      >
        <SplitterPanel size={20} style={{ minWidth: 250, maxWidth: 600 }}>
          <section className="invisible insplit">
            <section className="row invisible" style={{ flexGrow: 1 }}>
              {hierarchy}
            </section>
            <TasksPanel />
          </section>
        </SplitterPanel>

        <SplitterPanel size={80}>
          <Splitter
            orientation="horizontal"
            stateKey={'detailSplitter'}
            stateStorage={'local'}
          >
            <SplitterPanel style={{ minWidth: 500 }}>{subsets}</SplitterPanel>
            <SplitterPanel style={{ minWidth: 250, maxWidth: 480 }}>
              <Detail />
            </SplitterPanel>
          </Splitter>
        </SplitterPanel>
      </Splitter>
    </main>
  )
}

export default BrowserPage
