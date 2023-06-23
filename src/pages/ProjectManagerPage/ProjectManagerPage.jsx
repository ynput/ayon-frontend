import { useState, useEffect } from 'react'
import { useNavigate, useParams, NavLink, useSearchParams } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { StringParam, useQueryParam, withDefault } from 'use-query-params'

import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog'
import { toast } from 'react-toastify'

import AddonSettings from '/src/containers/addonSettings'

import ProjectAnatomy from './ProjectAnatomy'
import ProjectRoots from './ProjectRoots'
import NewProjectDialog from './NewProjectDialog'
import ProjectDashboard from '/src/pages/ProjectDashboard'

import { selectProject } from '/src/features/context'
import { useDeleteProjectMutation } from '/src/services/project/updateProject'
import TeamsPage from '../TeamsPage'
import ProjectManagerPageContainer from './ProjectManagerPageContainer'
import ProjectManagerPageLayout from './ProjectManagerPageLayout'

const ProjectSettings = ({ projectList, projectManager }) => {
  return (
    <ProjectManagerPageLayout projectList={projectList} passthrough={!projectManager}>
      <AddonSettings />
    </ProjectManagerPageLayout>
  )
}
const SiteSettings = ({ projectList, projectManager }) => {
  return (
    <ProjectManagerPageLayout projectList={projectList} passthrough={!projectManager}>
      <AddonSettings showSites />
    </ProjectManagerPageLayout>
  )
}

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

  const userAccess = ['dashboard', 'siteSettings', 'teams']

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
        {links.map((link, i) =>
          link.node ? (
            link.node
          ) : (
            <NavLink
              to={link.path + (selectedProject ? `?project=${selectedProject}` : '')}
              key={i}
            >
              {link.name}
            </NavLink>
          ),
        )}
      </nav>
      {/* container wraps all modules and provides selectedProject, ProjectList comp and Toolbar comp as props */}
      <ProjectManagerPageContainer
        selection={selectedProject}
        onSelect={setSelectedProject}
        onNoProject={(s) => setSelectedProject(s)}
        isUser={isUser}
        onNewProject={() => setShowNewProject(true)}
        onDeleteProject={deletePreset}
      >
        {module === 'dashboard' && <ProjectDashboard />}
        {module === 'anatomy' && <ProjectAnatomy />}
        {module === 'projectSettings' && <ProjectSettings />}
        {module === 'siteSettings' && <SiteSettings />}
        {module === 'roots' && <ProjectRoots />}
        {module === 'teams' && <TeamsPage />}
      </ProjectManagerPageContainer>

      {showNewProject && (
        <NewProjectDialog
          onHide={(name) => {
            setShowNewProject(false)
            setSelectedProject(name)
          }}
        />
      )}
    </>
  )
}

export default ProjectManagerPage
