import { useState, useEffect } from 'react'
import { useNavigate, useParams, NavLink, useSearchParams } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { StringParam, useQueryParam, withDefault } from 'use-query-params'

import { Button, Toolbar } from '@ynput/ayon-react-components'
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog'
import { toast } from 'react-toastify'

import ProjectList from '/src/containers/projectList'
import AddonSettings from '/src/containers/addonSettings'

import ProjectAnatomy from './ProjectAnatomy'
import ProjectRoots from './ProjectRoots'
import NewProjectDialog from './NewProjectDialog'
import ProjectDashboard from '/src/pages/ProjectDashboard'

import { selectProject } from '/src/features/context'
import { useDeleteProjectMutation } from '/src/services/project/updateProject'
import TeamsPage from '../TeamsPage'

const ProjectManagerPage = () => {
  const navigate = useNavigate()
  // get is user from context
  const isUser = useSelector((state) => state.user.data.isUser)
  const projectName = useSelector((state) => state.project.name)
  const dispatch = useDispatch()

  let { module } = useParams()

  const [showNewProject, setShowNewProject] = useState(false)

  // QUERY PARAMS STATE
  const [selectedProject, setSelectedProject] = useQueryParam(
    'project',
    withDefault(StringParam, projectName),
  )

  useEffect(() => {
    // Update project name in header
    dispatch(selectProject(selectedProject))
  }, [selectedProject])

  // has project list been loaded and selection vaidated?
  const [isProjectValid, setIsProjectValid] = useState(false)

  // Search params
  const [searchParams] = useSearchParams()
  const queryProject = searchParams.get('project')

  //   // set initial selected project
  useEffect(() => {
    if (queryProject) setSelectedProject(queryProject)
  }, [])

  const [deleteProject] = useDeleteProjectMutation()

  const deletePreset = () => {
    confirmDialog({
      header: 'Delete Preset',
      message: `Are you sure you want to delete the project: ${selectedProject}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Delete',
      accept: () => {
        deleteProject({ projectName: selectedProject })
          .unwrap()
          .then(() => {
            toast.info(`Project ${selectedProject} deleted`)
            setSelectedProject(null)
          })
          .catch((err) => {
            toast.error(err.message)
          })
      },
      rejectLabel: 'Cancel',
      reject: () => {
        // do nothing
      },
    })
  }

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
    {
      name: 'Teams',
      path: '/manageProjects/teams',
      module: 'teams',
    },
  ]

  // filter links if isUser
  if (isUser) {
    links = links.filter((link) => userAccess.includes(link.module))
  }

  return (
    <>
      <ConfirmDialog />
      <nav className="secondary">
        {links.map((link, i) => (
          <NavLink to={link.path + (selectedProject ? `?project=${selectedProject}` : '')} key={i}>
            {link.name}
          </NavLink>
        ))}
      </nav>
      <Toolbar style={{ padding: 8 }}>
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
              disabled={!selectedProject}
              onClick={deletePreset}
            />
          </>
        )}
      </Toolbar>
      <main style={{ overflowY: 'clip' }}>
        {showNewProject && (
          <NewProjectDialog
            onHide={(name) => {
              setShowNewProject(false)
              setSelectedProject(name)
            }}
          />
        )}

        <ProjectList
          selection={selectedProject}
          onSelect={setSelectedProject}
          style={{ minWidth: 100 }}
          styleSection={{ maxWidth: 150, minWidth: 150 }}
          hideCode
          onNoProject={(s) => setSelectedProject(s)}
          autoSelect
          onSuccess={() => setIsProjectValid(true)}
        />

        {selectedProject && isProjectValid && (
          <>
            {module === 'dashboard' && <ProjectDashboard projectName={selectedProject} />}
            {module === 'anatomy' && <ProjectAnatomy projectName={selectedProject} />}
            {module === 'projectSettings' && <AddonSettings projectName={selectedProject} />}
            {module === 'siteSettings' && (
              <AddonSettings projectName={selectedProject} showSites={true} />
            )}
            {module === 'roots' && <ProjectRoots projectName={selectedProject} />}
            {module === 'teams' && <TeamsPage projectName={selectedProject} />}
          </>
        )}
      </main>
    </>
  )
}

export default ProjectManagerPage
