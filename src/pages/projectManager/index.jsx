import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { SelectButton } from 'primereact/selectbutton'
import { Button, Spacer, Section, Toolbar, Panel } from '/src/components'
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
      name: 'addons',
      label: 'Addons',
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

      <Section size={400} style={{ width: 400, maxWidth: 400 }}>
        <Toolbar>
          <Button
            label="Create a new project"
            icon="create_new_folder"
            onClick={() => setShowNewProject(true)}
          />
        </Toolbar>
        <Panel>
          <ProjectList
            selection={selectedProject}
            onSelect={setSelectedProject}
            reloadTrigger={projectListTimestamp}
          />
        </Panel>
      </Section>

      {selectedProject && (
        <Section>
          <Toolbar>
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
          </Toolbar>

          <Panel className="transparent">
            {currentView === 'dashboard' && (
              <ProjectStats projectName={selectedProject} />
            )}
            {currentView === 'addons' && (
              <ProjectStats projectName={selectedProject} />
            )}
            {currentView === 'settings' && (
              <ProjectSettings projectName={selectedProject} />
            )}
          </Panel>
        </Section>
      )}
    </main>
  )
}

export default ProjectManager
