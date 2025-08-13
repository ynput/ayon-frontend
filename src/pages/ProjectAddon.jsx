import { useRef, useMemo, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Section, Button, Dialog } from '@ynput/ayon-react-components'
import styled from 'styled-components'

import Hierarchy from '@containers/hierarchy'
import TaskList from '@containers/taskList'
import useAddonContextResend from '@hooks/useAddonContextResend'
import LoadingPage from './LoadingPage'
import DocumentTitle from '@components/DocumentTitle/DocumentTitle'

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

const ProjectAddon = ({ addonName, addonVersion, sidebar, ...props }) => {
  const addonRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [requestModal, setRequestModal] = useState(false)

  const context = useSelector((state) => state.context)
  const projectName = useSelector((state) => state.project.name)
  const userName = useSelector((state) => state.user.name)
  const focusedFolders = context.focused.folders
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
    const addonWnd = addonRef.current.contentWindow
    addonWnd.postMessage({
      scope: 'project',
      accessToken: localStorage.getItem('accessToken'),
      context: {
        ...context,
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
  }, [focusedFolders])

  // Push context to addon whenever explicitly requested
  useAddonContextResend(pushContext)

  // Render sidebar
  // Each addon may have a sidebar component that is rendered on the left side of the screen
  // Sidebars are built-in and whether they are displayed or not is controlled by the addon

  const sidebarComponent = useMemo(() => {
    if (sidebar === 'hierarchy') {
      return <Hierarchy style={{ maxWidth: 500, minWidth: 300 }} />
    } else {
      return <></>
    }
  }, [sidebar])

  const onAddonLoad = () => {
    setLoading(false)
    setTimeout(() => pushContext(), 20)
  }

  // Generate title for the project addon
  const addonTitle = addonName ? `${addonName} • ${projectName}` : `Addon • ${projectName}`

  return (
    <main {...props}>
      <DocumentTitle title={addonTitle} />
      {sidebarComponent}
      <Section>
        <RequestModal {...requestModal} onClose={() => setRequestModal(null)} />
        {loading && (
          <div style={{ position: 'absolute', inset: 0 }}>
            <LoadingPage style={{ position: 'absolute' }} />
          </div>
        )}
        <AddonWrapper
          style={{ opacity: loading ? 0 : 1 }}
          src={`${addonUrl}/?id=${window.senderId}`}
          ref={addonRef}
          onLoad={onAddonLoad}
        />
      </Section>
    </main>
  )
}

export default ProjectAddon
