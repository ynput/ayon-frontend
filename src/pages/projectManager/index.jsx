import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '/src/components'
import ProjectList from '/src/containers/projectList'

import ProjectStats from './stats'
import NewProjectDialog from './newProject'


const ProjectManager = () => {
  const navigate = useNavigate()
  const [projectListTimestamp, setProjectListTimestamp] = useState(0)
  const [selectedProject, setSelectedProject] = useState(null)
  const [showNewProject, setShowNewProject] = useState(false)

  const deleteProject = () => {}

  return (
    <main>
      {showNewProject && (
        <NewProjectDialog
          onHide={() => {
            setProjectListTimestamp(projectListTimestamp + 1)
            setShowNewProject(false)
          }}
        />
      )}

      <section className="lighter" style={{ flexBasis: '600px', padding: 0 }}>
          <ProjectList
            selectedProject={selectedProject}
            onSelectProject={setSelectedProject} 
            reloadTrigger={projectListTimestamp}
          />
      </section>

      <section style={{ flexGrow: 1 }} className="invisible">
        <section className="invisible row">
          <h1>{selectedProject ? selectedProject : 'SELECT A PROJECT'}</h1>
        </section>

        <section className="invisible row">
          <Button
            label="Open selected project"
            icon="folder_open"
            disabled={!selectedProject}
            onClick={() =>
              navigate(`/projects/${selectedProject}/browser`)
            }
          />
          <Button
            label="Delete selected project"
            icon="delete"
            className="p-button-danger"
            disabled={true || !selectedProject}
            onClick={deleteProject}
          />
          <Button
            label="Create a new project"
            icon="create_new_folder"
            onClick={() => setShowNewProject(true)}
          />
          <div style={{ flexGrow: 1 }} />
        </section>

        <section style={{ flexGrow: 1 }}>
          {selectedProject && (
            <ProjectStats projectName={selectedProject} />
          )}
        </section>
      </section>
    </main>
  )
}

export default ProjectManager
