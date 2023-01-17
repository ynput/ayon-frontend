import ayonClient from '/src/ayon'
import { useState, useMemo } from 'react'
import { useNavigate, useParams, NavLink } from 'react-router-dom'

import { Button, Toolbar, Section } from '@ynput/ayon-react-components'
import { Dropdown } from 'primereact/dropdown'

import ProjectList from '/src/containers/projectList'
import AddonSettings from '/src/containers/addonSettings'

import ProjectDashboard from './ProjectDashboard'
import ProjectAnatomy from './ProjectAnatomy'
import ProjectRoots from './ProjectRoots'
import NewProjectDialog from './NewProjectDialog'

const LocalSettings = ({ projectName }) => {
  const [siteId, setSiteId] = useState(null)

  const siteOptions = useMemo(() => {
    const options = []
    for (const site of ayonClient.settings.sites) {
      options.push({ label: site.hostname, value: site.id })
    }
    return options
  }, [])

  return (
    <Section>
      <Toolbar>
        <Dropdown
          options={siteOptions}
          value={siteId}
          optionLabel="label"
          optionValue="value"
          onChange={(e) => setSiteId(e.value)}
        />
      </Toolbar>
      <div style={{ display: 'flex', flexDirection: 'row', flexGrow: 1 }}>
        <AddonSettings projectName={projectName} />
      </div>
    </Section>
  )
}

const ProjectManager = () => {
  const navigate = useNavigate()

  const { module } = useParams()

  const [selectedProject, setSelectedProject] = useState(null)
  const [showNewProject, setShowNewProject] = useState(false)
  const [listReloadTrigger, setListReloadTrigger] = useState(0)

  const deleteProject = () => {
    setListReloadTrigger((val) => val + 1)
  }

  const toolbar = (
    <Toolbar>
      <Button
        label="New project"
        icon="create_new_folder"
        onClick={() => setShowNewProject(true)}
      />
      <Button
        label="Open project"
        icon="folder_open"
        disabled={!selectedProject}
        onClick={() => navigate(`/projects/${selectedProject}/browser`)}
      />
      <Button
        label="Delete project"
        icon="delete"
        className="p-button-danger"
        disabled={true || !selectedProject}
        onClick={deleteProject}
      />
    </Toolbar>
  )

  return (
    <>
      <nav className="secondary">
        <NavLink to={`/projectManager/dashboard`}>Dashboard</NavLink>
        <NavLink to={`/projectManager/anatomy`}>Anatomy</NavLink>
        <NavLink to={`/projectManager/projectSettings`}>Project settings</NavLink>
        <NavLink to={`/projectManager/localSettings`}>Local settings</NavLink>
        <NavLink to={`/projectManager/roots`}>Roots</NavLink>
      </nav>
      <main>
        {showNewProject && (
          <NewProjectDialog
            onHide={() => {
              setShowNewProject(false)
              setListReloadTrigger((val) => val + 1)
            }}
          />
        )}

        <ProjectList
          header={toolbar}
          selection={selectedProject}
          onSelect={setSelectedProject}
          reloadTrigger={listReloadTrigger}
        />

        {selectedProject && (
          <>
            {module === 'dashboard' && <ProjectDashboard projectName={selectedProject} />}
            {module === 'anatomy' && <ProjectAnatomy projectName={selectedProject} />}
            {module === 'projectSettings' && <AddonSettings projectName={selectedProject} />}
            {module === 'localSettings' && <LocalSettings projectName={selectedProject} />}
            {module === 'roots' && <ProjectRoots projectName={selectedProject} />}
          </>
        )}
      </main>
    </>
  )
}

export default ProjectManager
