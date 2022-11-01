import { useState } from 'react'
import { useNavigate, useParams, NavLink } from 'react-router-dom'

import { Button, Toolbar } from '/src/components'
import ProjectList from '/src/containers/projectList'

import ProjectStats from './stats'
import NewProjectDialog from './newProject'
import AddonSettings from '/src/containers/addonSettings'

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
        <NavLink to={`/projectManager/settings`}>Settings</NavLink>
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
            {module === 'dashboard' && (
              <ProjectStats projectName={selectedProject} />
            )}

            {module === 'settings' && (
              <AddonSettings projectName={selectedProject} />
            )}
          </>
        )}
      </main>
    </>
  )
}

export default ProjectManager
