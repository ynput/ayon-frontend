import { useState, useEffect } from 'react'
import { useParams, NavLink } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'

import { Dialog } from 'primereact/dialog'
import { Spacer, Button } from '../components'

import BrowserPage from './browser'
import ManagerPage from './manager'
import SiteSync from './sitesync'
import LoadingPage from './loading'

import { selectProject, setProjectData } from '../features/context'

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

  const [loading, setLoading] = useState(true)
  const { projectName, module } = useParams()
  const dispatch = useDispatch()
  const [showContextDialog, setShowContextDialog] = useState(false)

  // Set project data to null when leaving project page
  useEffect(() => {
    return () => dispatch(selectProject(null))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch project data
  useEffect(() => {
    setLoading(true)
    axios
      .get(`/api/projects/${projectName}`)
      .then((response) => dispatch(setProjectData(response.data)))
      .finally(() => {
        dispatch(selectProject(projectName))
        setLoading(false)
      })
  }, [dispatch, projectName])

  //
  // Render page
  //

  if (loading) {
    return <LoadingPage />
  }

  let child = null
  if (module === 'manager') child = <ManagerPage />
  else if (module === 'sitesync') child = <SiteSync />
  else child = <BrowserPage />

  return (
    <>
      <Dialog
        header="Project Context"
        visible={showContextDialog}
        onHide={() => setShowContextDialog(false)}
      >
        {showContextDialog && <ProjectContexInfo />}
      </Dialog>
      <nav>
        <NavLink to={`/projects/${projectName}/browser`}>Browser</NavLink>
        <NavLink to={`/projects/${projectName}/manager`}>Manager</NavLink>
        <NavLink to={`/projects/${projectName}/sitesync`}>SiteSync</NavLink>
        <Spacer />
        <Button
          className="p-button-link"
          icon="pi pi-cog"
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
