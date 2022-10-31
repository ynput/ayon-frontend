import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { SelectButton } from 'primereact/selectbutton'
import { Button, Spacer, Section, Toolbar, Panel } from '/src/components'
import ProjectList from '/src/containers/projectList'

import ProjectStats from './stats'
import NewProjectDialog from './newProject'
import MultiAddonSettings from '/src/containers/multiAddonSettings'

const ProjectManager = () => {
  const navigate = useNavigate()
  const [selectedProject, setSelectedProject] = useState(null)
  const [showNewProject, setShowNewProject] = useState(false)
  const [currentView, setCurrentView] = useState('dashboard')
  const [listReloadTrigger, setListReloadTrigger] = useState(0)

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

  const deleteProject = () => {
    setListReloadTrigger((val) => val + 1)
  }

  const toolbar = (
    <Toolbar>
      <Button
        label="Create a new project"
        icon="create_new_folder"
        onClick={() => setShowNewProject(true)}
      />
    </Toolbar>
  )

  return (
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

          <Panel className="transparent nopad" style={{flexDirection: 'row'}}>
            {currentView === 'dashboard' && (
              <ProjectStats projectName={selectedProject} />
            )}
            {currentView === 'addons' && (
              <ProjectStats projectName={selectedProject} />
            )}
            {currentView === 'settings' && (
              <MultiAddonSettings projectName={selectedProject} />
            )}
          </Panel>
        </Section>
      )}
    </main>
  )
}

export default ProjectManager
