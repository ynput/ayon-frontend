import { useState, useEffect } from 'react'
import { useParams, NavLink } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'

import { Dialog } from 'primereact/dialog'
import { Spacer, Button } from '../components'

import BrowserPage from './browser'
import EditorPage from './editor'
import SiteSync from './sitesync'
import LoadingPage from './loading'
import ProjectAddon from './projectAddon'
import WorkfilesPage from './workfiles'

import { selectProject, setProjectData } from '../features/context'
import { updateFolderTypeIcons, updateTaskTypeIcons } from '../utils'

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
  const [addons, setAddons] = useState([])
  const { projectName, module, addonName } = useParams()
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
      .then((response) => {
        const data = response.data
        dispatch(setProjectData(data))

        // Icons
        const r = {}
        for (const folderTypeName in data.folderTypes) {
          r[folderTypeName] = data.folderTypes[folderTypeName].icon
        }
        updateFolderTypeIcons(r)

        const s = {}
        for (const taskTypeName in data.taskTypes) {
          s[taskTypeName] = data.taskTypes[taskTypeName].icon
        }
        updateTaskTypeIcons(s)

        // Load addons
        // Loading it here beceause we can have a version override
        // from the project data

        axios.get('/api/addons').then((response) => {
          let result = []
          for (const definition of response.data.addons) {
            const versDef = definition.versions[definition.productionVersion]
            if (!versDef) continue
            const projectScope = versDef.frontendScopes['project']
            if (!projectScope) continue

            result.push({
              name: definition.name,
              title: definition.title,
              version: definition.productionVersion,
              settings: projectScope,
            })
          }
          setAddons(result)
        })
      })
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
  if (module === 'editor') child = <EditorPage />
  else if (module === 'workfiles') child = <WorkfilesPage />
  else if (module === 'sitesync') child = <SiteSync />
  else if (addonName) {
    for (const addon of addons) {
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
        <NavLink to={`/projects/${projectName}/sitesync`}>SiteSync</NavLink>
        {addons.map((addon) => (
          <NavLink
            to={`/projects/${projectName}/addon/${addon.name}`}
            key={addon.name}
          >
            {addon.title}
          </NavLink>
        ))}
        <Spacer />
        <Button
          className="p-button-link"
          icon="settings"
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
