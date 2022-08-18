import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { SelectButton } from 'primereact/selectbutton'
import { Button, Spacer } from '/src/components'
import ProjectList from '/src/containers/projectList'

import ProjectStats from './stats'
import ProjectSettings from './settings'
import NewProjectDialog from './newProject'

const ProjectManager = () => {
  const navigate = useNavigate()
  const [projectListTimestamp, setProjectListTimestamp] = useState(0)
  const [selectedProject, setSelectedProject] = useState(null)
  const [showNewProject, setShowNewProject] = useState(false)
  const [currentView, setCurrentView] = useState('dashboard')

  const views = [
    {
      name: 'dashboard',
      label: 'Dashboard',
    },
    {
      name: 'settings',
      label: 'Settings',
    },
  ]

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

      <section className="invisible" style={{ flexBasis: '400px', padding: 0 }}>
        <section className="invisible row">
          <Button
            label="Create a new project"
            icon="create_new_folder"
            onClick={() => setShowNewProject(true)}
          />
          <Spacer />
        </section>
        <section style={{ flexGrow: 1 }}>
          <ProjectList
            selection={selectedProject}
            onSelect={setSelectedProject}
            reloadTrigger={projectListTimestamp}
          />
        </section>
      </section>

      {selectedProject && (
        <section style={{ flexGrow: 1 }} className="invisible">
          <section className="invisible row">
            <SelectButton
              value={currentView}
              optionValue="name"
              options={views}
              unselectable={false}
              onChange={(e) => setCurrentView(e.value)}
            ></SelectButton>

            <Spacer>
              <h3>{selectedProject}</h3>
            </Spacer>

            <Button
              label="Open selected project"
              icon="folder_open"
              disabled={!selectedProject}
              onClick={() => navigate(`/projects/${selectedProject}/browser`)}
            />
            <Button
              label="Delete selected project"
              icon="delete"
              className="p-button-danger"
              disabled={true || !selectedProject}
              onClick={deleteProject}
            />
          </section>

          <section className="invisible" style={{ flexGrow: 1 }}>
            {currentView === 'dashboard' && (
              <ProjectStats projectName={selectedProject} />
            )}
            {currentView === 'settings' && (
              <ProjectSettings projectName={selectedProject} />
            )}
          </section>
        </section>
      )}
    </main>
  )
}

export default ProjectManager
