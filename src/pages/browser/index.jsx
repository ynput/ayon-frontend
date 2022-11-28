import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import { Splitter, SplitterPanel } from 'primereact/splitter'
import { Section } from 'openpype-components'

import Hierarchy from '/src/containers/hierarchy'
import TaskList from '/src/containers/taskList'

import Subsets from './subsets'
import Detail from './detail'

const BrowserPage = () => {
  const context = useSelector((state) => ({ ...state.context }))
  const projectName = context.projectName
  const folderTypes = context.project.folderTypes
  const expandedFolders = context.expandedFolders
  const focusedFolders = context.focusedFolders
  const focusedVersions = context.focusedVersions
  const selectedVersions = context.selectedVersions
  const focusedSubsets = context.focusedSubsets
  const pairing = context.pairing

  // Cache components

  const hierarchy = useMemo(() => {
    return (
      <Hierarchy
        projectName={projectName}
        folderTypes={folderTypes}
        focusedFolders={focusedFolders}
        expandedFolders={expandedFolders}
      />
    )
  }, [projectName, folderTypes, focusedFolders, expandedFolders])

  const subsets = useMemo(() => {
    return (
      <Subsets
        projectName={projectName}
        folders={focusedFolders}
        focusedVersions={focusedVersions}
        focusedSubsets={focusedSubsets}
        pairing={pairing}
        selectedVersions={selectedVersions}
      />
    )
  }, [
    projectName,
    focusedFolders,
    focusedVersions,
    selectedVersions,
    focusedSubsets,
    pairing,
  ])

  // Return the wrapper

  return (
    <main>
      <Splitter layout="horizontal" style={{ width: '100%', height: '100%' }}>
        <SplitterPanel size={18} style={{ minWidth: 250, maxWidth: 600 }}>
          <Section className="wrap">
            {hierarchy}
            <TaskList style={{ maxHeight: 300 }} />
          </Section>
        </SplitterPanel>

        <SplitterPanel size={82}>
          <Splitter layout="horizontal" style={{ height: '100%' }}>
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
