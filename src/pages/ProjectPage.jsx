import { useState, useEffect } from 'react'
import { useParams, NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Spacer, Button } from '@ynput/ayon-react-components'

import BrowserPage from './BrowserPage'
import EditorPage from './EditorPage'
import LoadingPage from './LoadingPage'
import ProjectAddon from './ProjectAddon'
import WorkfilesPage from './WorkfilesPage'

import usePubSub from '/src/hooks/usePubSub'
import { setUri } from '/src/features/context'
import { selectProject } from '/src/features/project'
import { useGetProjectQuery } from '../services/project/getProject'
import { useGetProjectAddonsQuery } from '../services/addons/getAddons'
import { TabPanel, TabView } from 'primereact/tabview'
import { Dialog } from 'primereact/dialog'

const ProjectContexInfo = () => {
  /**
   * Show a project context in a dialog
   * this is for develompent only
   */
  const context = useSelector((state) => state.context)
  const project = useSelector((state) => state.project)
  return (
    <TabView>
      <TabPanel header="context">
        <pre>{JSON.stringify({ context }, null, 2)}</pre>
      </TabPanel>
      <TabPanel header="project">
        <pre>{JSON.stringify({ project }, null, 2)}</pre>
      </TabPanel>
    </TabView>
  )
}

const ProjectPage = () => {
  /**
   * This component is a wrapper for all project pages
   * It parses the url, loads the project data, dispatches the
   * project data to the store, and renders the requested page.
   */

  const uri = useSelector((state) => state.context.uri)
  const navigate = useNavigate()
  const { projectName, module, addonName } = useParams()
  const dispatch = useDispatch()
  const [showContextDialog, setShowContextDialog] = useState(false)
  const { isLoading, isError, isUninitialized, refetch } = useGetProjectQuery(
    { projectName },
    { skip: !projectName },
  )

  const {
    data: addonsData,
    isLoading: addonsLoading,
    isError: addonsIsError,
    refetch: refetchAddons,
    isUninitialized: addonsIsUninitialized,
  } = useGetProjectAddonsQuery({}, { skip: !projectName })

  useEffect(() => {
    // originally, i thought we could dispatch bare project name
    // to set breadcrumbs, but that resets the uri, when the project change
    // is done by pasting a new uri.
    // so i commented this out - this means project change won't trigger
    // breadcrumbs update, until something is clicked. but i think that's ok for now.

    // this might work
    if (!uri) {
      dispatch(setUri(`ayon+entity://${projectName}`))
    }
  }, [projectName])

  useEffect(() => {
    // Clear URI when project page is unmounted
    return () => dispatch(setUri(null))
  }, [])

  useEffect(() => {
    if (!addonsLoading && !addonsIsError && addonsData) {
      dispatch(selectProject(projectName))
    } else {
      // redirect to project manager
    }
  }, [addonsLoading, addonsIsError, addonsData, projectName])

  const loadProjectData = () => {
    if (!isUninitialized && !addonsIsUninitialized && !isLoading && !addonsLoading) {
      refetch()
      refetchAddons()
    }
  }

  const handlePubSub = async (topic, message) => {
    if (topic === 'client.connected') {
      console.log('ProjectPage: client.connected. Reloading project data')
      loadProjectData()
    } else if (topic === 'entity.project.changed' && message.project === projectName) {
      loadProjectData()
    } else {
      console.log('ProjectPage: Unhandled pubsub message', topic, message)
    }
  }

  usePubSub('client.connected', handlePubSub)
  usePubSub('entity.project', handlePubSub)

  //
  // Render page
  //

  if (isLoading || !projectName || addonsLoading) {
    return <LoadingPage />
  }

  // error
  if (isError) {
    setTimeout(() => {
      navigate('/manageProjects/dashboard')
    }, 1500)
    return <div className="page">Project Not Found, Redirecting...</div>
  }

  let child = null
  if (module === 'editor') child = <EditorPage />
  else if (module === 'workfiles') child = <WorkfilesPage />
  else if (addonName) {
    for (const addon of addonsData) {
      if (addon.name === addonName) {
        child = (
          <ProjectAddon
            addonName={addonName}
            addonVersion={addon.version}
            sidebar={addon.settings.sidebar}
          />
        )
        break
      }
    }
  } else child = <BrowserPage />

  return (
    <>
      <Dialog
        header="Project Context"
        visible={showContextDialog}
        onHide={() => setShowContextDialog(false)}
        style={{
          overflow: 'hidden',
        }}
        bodyStyle={{
          overflow: 'auto',
        }}
      >
        {showContextDialog && <ProjectContexInfo />}
      </Dialog>
      <nav className="secondary">
        <NavLink to={`/projects/${projectName}/browser`}>Browser</NavLink>
        <NavLink to={`/projects/${projectName}/editor`}>Editor</NavLink>
        <NavLink to={`/projects/${projectName}/workfiles`}>Workfiles</NavLink>
        {addonsData.map((addon) => (
          <NavLink to={`/projects/${projectName}/addon/${addon.name}`} key={addon.name}>
            {addon.title}
          </NavLink>
        ))}
        <Spacer />
        <Button
          className="transparent"
          icon="more_horiz"
          onClick={() => {
            setShowContextDialog(true)
          }}
        />
      </nav>
      {child}
    </>
  )
}

export default ProjectPage
