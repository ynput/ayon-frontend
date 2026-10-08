import { useRef, useMemo, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Section, Button, Dialog } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import { Splitter, SplitterPanel } from 'primereact/splitter'

import Hierarchy from '@containers/hierarchy'
import TaskList from '@containers/taskList'
import useAddonContextResend from '@hooks/useAddonContextResend'
import LoadingPage from './LoadingPage'
import DocumentTitle from '@components/DocumentTitle/DocumentTitle'
import DetailsPanelSplitter from '@components/DetailsPanelSplitter'
import { SLICER_PAGES_CONFIG, Slicer, useSlicerContext, useSlicerSplitter } from '@shared/containers'
import { AddonDetailsPanel, getDetailsSelection, useAddonMessages } from '@containers/AddonPanels'

// the iframe has to stay mounted, so a hidden slicer is hidden, not removed
const SlicerSplitter = styled(Splitter)`
  &.slicer-hidden > .p-splitter-panel:first-child,
  &.slicer-hidden > .p-splitter-gutter {
    display: none;
  }
  &.slicer-hidden > .p-splitter-panel:last-child {
    flex-basis: 100% !important;
  }
`

const AddonWrapper = styled.iframe`
  flex-grow: 1;
  background: 'transparent';
  border: 0;
  overflow: auto;
`

const TaskPicker = ({ callback, multiple }) => {
  const focusedTasks = useSelector((state) => state.context.focused.tasks)

  const errorMessage = useMemo(() => {
    if (multiple && !focusedTasks.length) return 'Please select at least one task'
    if (!multiple && focusedTasks.length !== 1) return 'Please select exactly one task'
  }, [focusedTasks])

  const footer = useMemo(() => {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ color: 'red' }}>{errorMessage}</span>
        <Button
          label="Select"
          icon="library_add_check"
          disabled={!focusedTasks.length}
          onClick={() => callback(multiple ? focusedTasks : focusedTasks[0])}
        />
      </div>
    )
  }, [errorMessage, focusedTasks])

  return (
    <Dialog
      header="Select task"
      size="lg"
      footer={footer}
      isOpen={true}
      onClose={() => callback(null)}
    >
      <div style={{ display: 'flex', flexDirection: 'row', minHeight: 500, gap: 12 }}>
        <Hierarchy style={{ flex: 1, minWidth: 250, maxWidth: 500 }} />
        <TaskList style={{ flex: 0.75, minWidth: 250, maxWidth: 500 }} />
      </div>
    </Dialog>
  )
}

const FolderPicker = ({ callback, multiple }) => {
  const focusedFolders = useSelector((state) => state.context.focused.folders)

  const errorMessage = useMemo(() => {
    if (multiple && !focusedFolders.length) return 'Please select at least one folder'
  }, [focusedFolders])

  const footer = useMemo(() => {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ color: 'red' }}>{errorMessage}</span>
        <Button
          label="Select"
          icon="library_add_check"
          disabled={!focusedFolders.length}
          onClick={() => callback(multiple ? focusedFolders : focusedFolders[0])}
        />
      </div>
    )
  }, [errorMessage, focusedFolders])

  return (
    <Dialog
      header="Select folder"
      size="lg"
      footer={footer}
      isOpen={true}
      onClose={() => callback(null)}
      style={{ maxHeight: 'unset' }}
    >
      <Hierarchy style={{ flex: 1, minWidth: 250, minHeight: 400 }} />
    </Dialog>
  )
}

const RequestModal = ({ onClose, callback = () => {}, requestType = null, ...props }) => {
  if (!requestType) return <></>

  const onSubmit = (value) => {
    callback(value)
    onClose()
  }

  if (requestType === 'taskPicker') {
    return <TaskPicker {...props} callback={onSubmit} />
  }
  if (requestType === 'folderPicker') {
    return <FolderPicker {...props} callback={onSubmit} />
  }
}

const ProjectAddon = ({ addonName, addonVersion, sidebar, addonTitle, ...props }) => {
  const addonRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [requestModal, setRequestModal] = useState(false)

  const context = useSelector((state) => state.context)
  const projectName = useSelector((state) => state.project.name)
  const userName = useSelector((state) => state.user.name)
  const hasSlicer = sidebar === 'hierarchy'
  const { getPanelSelection } = useSlicerContext()
  const hierarchySelection = getPanelSelection('hierarchy')
  const slicerFolders = useMemo(
    () => Object.keys(hierarchySelection).filter((id) => hierarchySelection[id]),
    [hierarchySelection],
  )
  // addons get the folders selected in the slicer as the focused folders
  const focusedFolders = hasSlicer ? slicerFolders : context.focused.folders
  const addonUrl = `${window.location.origin}/addons/${addonName}/${addonVersion}/frontend`

  // Modals are used to display unified interface for
  // picking entities and other tasks from the addon

  const modalRequest = (requestType, callback) => {
    setRequestModal({ callback, requestType })
  }

  //Switching between addons didn't update the loading state which affects the rest of the logic
  useEffect(() => {
    setLoading(true)
  }, [addonUrl])

  useEffect(() => {
    window.modalRequest = modalRequest
    return () => (window.modalRequest = undefined)
  }, [])

  // Push context to addon
  // This is done on every context change.
  // Context contains information on the current project, focused folders, logged in user etc.

  const pushContext = () => {
    const addonWnd = addonRef.current?.contentWindow
    if (!addonWnd) return
    addonWnd.postMessage({
      scope: 'project',
      accessToken: localStorage.getItem('accessToken'),
      context: {
        ...context,
        focused: { ...context.focused, folders: focusedFolders },
        projectName, //deprecated i guess
      },
      userName,
      projectName,
      addonName,
      addonVersion,
    })
  }

  // Push context on addon load and on every context change
  useEffect(() => {
    if (loading) {
      return
    }
    pushContext()
  }, [focusedFolders.join(',')])

  // Push context to addon whenever explicitly requested
  const pushContextRef = useRef(pushContext)
  pushContextRef.current = pushContext
  useAddonContextResend(() => pushContextRef.current())

  // The addon can open the details panel and the player, and hide the slicer (see useAddonMessages)
  const { selection, isDetailsOpen, closeDetails, isSidebarVisible } = useAddonMessages(
    addonRef,
    projectName,
    addonName,
  )
  const showDetails = isDetailsOpen && !!getDetailsSelection(selection)

  // Sidebar and details panel are resizable, the sidebar keeps the width of
  // the other project pages. The iframe would swallow the pointer while a
  // splitter is dragged over it, so it ignores the pointer during a drag.
  const [slicerSize, handleSlicerResizeEnd] = useSlicerSplitter()
  const [isResizing, setIsResizing] = useState(false)
  useEffect(() => {
    if (!isResizing) return
    const stop = () => setIsResizing(false)
    window.addEventListener('pointerup', stop)
    return () => window.removeEventListener('pointerup', stop)
  }, [isResizing])
  const onPointerDownCapture = (e) => {
    if (e.target.closest?.('.p-splitter-gutter')) setIsResizing(true)
  }

  const onAddonLoad = () => {
    setLoading(false)
    setTimeout(() => pushContextRef.current(), 20)
  }

  // Generate title for the project addon
  const pageTitle = addonTitle
    ? `${addonTitle} • ${projectName}`
    : addonName
    ? `${addonName} • ${projectName}`
    : `Addon • ${projectName}`

  const content = (
    <DetailsPanelSplitter
      layout="horizontal"
      stateKey="addon-splitter-details"
      stateStorage="local"
      style={{ width: '100%', height: '100%' }}
    >
      <SplitterPanel size={70}>
        <Section style={{ height: '100%' }}>
          <RequestModal {...requestModal} onClose={() => setRequestModal(null)} />
          {loading && (
            <div style={{ position: 'absolute', inset: 0 }}>
              <LoadingPage style={{ position: 'absolute' }} />
            </div>
          )}
          <AddonWrapper
            style={{ opacity: loading ? 0 : 1, pointerEvents: isResizing ? 'none' : undefined }}
            src={`${addonUrl}/?id=${window.senderId}`}
            ref={addonRef}
            onLoad={onAddonLoad}
          />
        </Section>
      </SplitterPanel>
      <SplitterPanel size={30} className="details" style={{ minWidth: 300, zIndex: 300 }}>
        {showDetails && <AddonDetailsPanel selection={selection} onClose={closeDetails} />}
      </SplitterPanel>
    </DetailsPanelSplitter>
  )

  return (
    <main {...props} onPointerDownCapture={onPointerDownCapture}>
      <DocumentTitle title={pageTitle} />
      {/* Each addon may have a sidebar component that is rendered on the left side of the screen.
          Sidebars are built-in and whether they are displayed or not is controlled by the addon */}
      {hasSlicer ? (
        <SlicerSplitter
          layout="horizontal"
          style={{ width: '100%', height: '100%' }}
          onResizeEnd={handleSlicerResizeEnd}
          className={isSidebarVisible ? undefined : 'slicer-hidden'}
        >
          <SplitterPanel size={slicerSize[0]} style={{ overflow: 'hidden' }}>
            <Section wrap>
              <Slicer sliceFields={SLICER_PAGES_CONFIG.addon.fields} entityTypes={['folder']} />
            </Section>
          </SplitterPanel>
          <SplitterPanel size={slicerSize[1]}>{content}</SplitterPanel>
        </SlicerSplitter>
      ) : (
        content
      )}
    </main>
  )
}

export default ProjectAddon
