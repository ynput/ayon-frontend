import { useState } from 'react'
import { useNavigate, useParams, NavLink } from 'react-router-dom'

import { Button, Toolbar } from '@ynput/ayon-react-components'

import ProjectList from '/src/containers/projectList'
import AddonSettings from '/src/containers/addonSettings'

import ProjectDashboard from './ProjectDashboard'
import ProjectAnatomy from './ProjectAnatomy'
import ProjectRoots from './ProjectRoots'
import NewProjectDialog from './NewProjectDialog'
import { useSelector } from 'react-redux'

const ManageProjects = () => {
  const navigate = useNavigate()
  // get is user from context
  const isUser = useSelector((state) => state.user.data.isUser)

  let { module } = useParams()

  const [selectedProject, setSelectedProject] = useState(null)
  const [showNewProject, setShowNewProject] = useState(false)
  const [listReloadTrigger, setListReloadTrigger] = useState(0)

  const deleteProject = () => {
    setListReloadTrigger((val) => val + 1)
  }

  const toolbar = (
    <Toolbar>
      <Button
        label="Open project"
        icon="folder_open"
        disabled={!selectedProject}
        onClick={() => navigate(`/projects/${selectedProject}/browser`)}
      />

      {!isUser && (
        <>
          <Button
            label="New project"
            icon="create_new_folder"
            onClick={() => setShowNewProject(true)}
          />

          <Button
            label="Delete project"
            icon="delete"
            className="p-button-danger"
            disabled={true || !selectedProject}
            onClick={deleteProject}
          />
        </>
      )}
    </Toolbar>
  )

  const userAccess = ['dashboard', 'siteSettings']

  // redirect to dashboard if user is not allowed to access this module
  if (isUser && !userAccess.includes(module)) {
    navigate('/manageProjects/dashboard')
  }

  let links = [
    {
      name: 'Dashboard',
      path: '/manageProjects/dashboard',
      module: 'dashboard',
    },
    {
      name: 'Anatomy',
      path: '/manageProjects/anatomy',
      module: 'anatomy',
    },
    {
      name: 'Project settings',
      path: '/manageProjects/projectSettings',
      module: 'projectSettings',
    },
    {
      name: 'Site settings',
      path: '/manageProjects/siteSettings',
      module: 'siteSettings',
    },
    {
      name: 'Roots',
      path: '/manageProjects/roots',
      module: 'roots',
    },
  ]

  // filter links if isUser
  if (isUser) {
    links = links.filter((link) => userAccess.includes(link.module))
  }

  return (
    <>
      <nav className="secondary">
        {links.map((link, i) => (
          <NavLink to={link.path} key={i}>
            {link.name}
          </NavLink>
        ))}
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
            {module === 'siteSettings' && (
              <AddonSettings projectName={selectedProject} showSites={true} />
            )}
            {module === 'roots' && <ProjectRoots projectName={selectedProject} />}
          </>
        )}
      </main>
    </>
  )
}

export default ManageProjects
