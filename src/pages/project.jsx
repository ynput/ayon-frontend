import { useState, useEffect } from 'react'
import { useParams, NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Spacer, Button } from '@ynput/ayon-react-components'

import { Dialog } from 'primereact/dialog'

import BrowserPage from './browser/BrowserPage'
import EditorPage from './editor'
import LoadingPage from './loading'
import ProjectAddon from './projectAddon'
import WorkfilesPage from './workfiles/WorkfilesPage'

import { selectProject, setProjectData } from '../features/context'
import {
  updateFolderTypeIcons,
  updateTaskTypeIcons,
  updateStatusColors,
  updateTagColors,
  updateStatusIcons,
  updateStatusShortNames,
} from '../utils'
import usePubSub from '/src/hooks/usePubSub'
import { useGetProjectQuery } from '../services/getProject'
import { useGetAddonProjectQuery } from '../services/addonList'

const ProjectContexInfo = () => {
  /**
   * Show a project context in a dialog
   * this is for develompent only
   */
  const context = useSelector((state) => state.context)
  return <pre>{JSON.stringify(context, null, 2)}</pre>
}

const ProjectPage = () => {
  /**
   * This component is a wrapper for all project pages
   * It parses the url, loads the project data, dispatches the
   * project data to the store, and renders the requested page.
   */
  const navigate = useNavigate()
  const { projectName, module, addonName } = useParams()
  const dispatch = useDispatch()
  const [showContextDialog, setShowContextDialog] = useState(false)
  const { data, isLoading, isError, isUninitialized, refetch } = useGetProjectQuery(
    { projectName },
    { skip: !projectName },
  )

  const {
    data: addonsData,
    isLoading: addonsLoading,
    isError: addonsIsError,
    refetch: refetchAddons,
    isUninitialized: addonsIsUninitialized,
  } = useGetAddonProjectQuery({}, { skip: !projectName })

  useEffect(() => {
    if (!isLoading && !isError) {
      dispatch(setProjectData(data))

      // Icons
      const r = {}
      for (const folderType of data.folderTypes) {
        r[folderType.name] = folderType.icon
      }
      updateFolderTypeIcons(r)

      const s = {}
      for (const taskType of data.taskTypes) {
        s[taskType.name] = taskType.icon
      }
      updateTaskTypeIcons(s)

      const t = {}
      for (const status of data.statuses) {
        t[status.name] = status.color
      }
      updateStatusColors(t)

      const i = {}
      for (const status of data.statuses) {
        i[status.name] = status.icon
      }
      updateStatusIcons(i)

      const n = {}
      for (const status of data.statuses) {
        n[status.name] = status.shortName
      }
      updateStatusShortNames(n)

      const g = {}
      for (const tag of data.tags) {
        g[tag.name] = tag.color
      }
      updateTagColors(g)

      //TODO: statuses

      localStorage.setItem('lastProject', projectName)
    }
  }, [isLoading, isError, data])

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
