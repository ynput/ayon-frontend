import { useState, useEffect, useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { StringParam, useQueryParam, withDefault } from 'use-query-params'

import AddonSettings from '@containers/AddonSettings'

import ProjectAnatomy from './ProjectAnatomy'
import ProjectRoots from './ProjectRoots'
import NewProjectDialog from './NewProjectDialog'

import { selectProject } from '@state/context'
import { useDeleteProjectMutation, useUpdateProjectMutation } from '@queries/project/updateProject'
import TeamsPage from '../TeamsPage'
import ProjectManagerPageContainer from './ProjectManagerPageContainer'
import ProjectManagerPageLayout from './ProjectManagerPageLayout'
import AppNavLinks from '@containers/header/AppNavLinks'
import confirmDelete from '@helpers/confirmDelete'
import useUserProjectPermissions, { UserPermissionsEntity } from '@hooks/useUserProjectPermissions'
import ProjectUserAccess from './Users/ProjectUserAccess'

const ProjectSettings = ({ projectList, projectManager, projectName }) => {
  return (
    <ProjectManagerPageLayout projectList={projectList} passthrough={!projectManager}>
      <AddonSettings projectName={projectName} />
    </ProjectManagerPageLayout>
  )
}
const SiteSettings = ({ projectList, projectManager, projectName }) => {
  return (
    <ProjectManagerPageLayout projectList={projectList} passthrough={!projectManager}>
      <AddonSettings showSites projectName={projectName} />
    </ProjectManagerPageLayout>
  )
}

const ProjectManagerPage = () => {
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

  const userPermissions = useUserProjectPermissions(!isUser)

  // UPDATE DATA
  const [updateProject] = useUpdateProjectMutation()

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

  const handleDeleteProject = (sel) => {
    confirmDelete({
      label: `Project: ${sel}`,
      accept: async () => {
        await deleteProject({ projectName: sel }).unwrap()
        setSelectedProject(null)
      },
    })
  }

  const handleActivateProject = async (sel, active) => {
    await updateProject({ projectName: sel, update: { active } }).unwrap()
  }

  const links = []
  if (!isUser || userPermissions.projectSettingsAreEnabled()) {
    if (userPermissions.canViewAny(UserPermissionsEntity.anatomy) || module === 'anatomy') {
      links.push({
        name: 'Anatomy',
        path: '/manageProjects/anatomy',
        module: 'anatomy',
        accessLevels: [],
        shortcut: 'A+A',
      })
    }

    if (userPermissions.canViewAny(UserPermissionsEntity.settings) || module === 'projectSettings') {
      links.push({
        name: 'Project settings',
        path: '/manageProjects/projectSettings',
        module: 'projectSettings',
        accessLevels: [],
        shortcut: 'P+P',
      })
    }
    if (userPermissions.canViewAny(UserPermissionsEntity.users) || module === 'userSettings') {
      links.push({
        name: 'Project access',
        path: '/manageProjects/userSettings',
        module: 'userSettings',
        accessLevels: [],
        shortcut: 'P+A',
      })
    }
  }

  links.push(
    {
      name: 'Site settings',
      path: '/manageProjects/siteSettings',
      module: 'siteSettings',
      accessLevels: [],
    },
    {
      name: 'Roots',
      path: '/manageProjects/roots',
      module: 'roots',
      accessLevels: [],
    },
    {
      name: 'Teams',
      path: '/manageProjects/teams',
      module: 'teams',
      accessLevels: ['manager'],
    },
  )

  const linksWithProject = useMemo(
    () =>
      links.map((link) => ({
        ...link,
        path: link.path + (selectedProject ? `?project=${selectedProject}` : ''),
      })),
    [links, selectedProject],
  )

  return (
    <>
      <AppNavLinks links={linksWithProject} />
      {/* container wraps all modules and provides selectedProject, ProjectList comp and Toolbar comp as props */}
      <ProjectManagerPageContainer
        selection={selectedProject}
        onSelect={setSelectedProject}
        onNoProject={(s) => setSelectedProject(s)}
        isUser={isUser}
        onNewProject={() => setShowNewProject(true)}
        onDeleteProject={handleDeleteProject}
        onActivateProject={handleActivateProject}
        customSort={(a, b) => {
          if (module === 'anatomy') {
            const aPerm = userPermissions.canView(UserPermissionsEntity.anatomy, a) ? 1 : -1
            const bPerm = userPermissions.canView(UserPermissionsEntity.anatomy, b) ? 1 : -1
            return bPerm - aPerm
          }
          if (module === 'siteSettings') {
            const aPerm = userPermissions.canView(UserPermissionsEntity.settings, a) ? 1 : -1
            const bPerm = userPermissions.canView(UserPermissionsEntity.settings, b) ? 1 : -1
            return bPerm - aPerm
          }
          return 0
        }}
        isActiveCallable={(projectName) => {
          if (module === 'anatomy') {
            return userPermissions.canView(UserPermissionsEntity.anatomy, projectName)
          }
          if (module === 'siteSettings') {
            return userPermissions.canView(UserPermissionsEntity.settings, projectName)
          }
          return true
        }}
      >
        {module === 'anatomy' && <ProjectAnatomy />}
        {module === 'projectSettings' && <ProjectSettings />}
        {module === 'siteSettings' && <SiteSettings />}
        {module === 'userSettings' && <ProjectUserAccess />}
        {module === 'roots' && <ProjectRoots />}
        {module === 'teams' && <TeamsPage />}
      </ProjectManagerPageContainer>

      {showNewProject && (
        <NewProjectDialog
          onHide={(name) => {
            setShowNewProject(false)
            if (name) setSelectedProject(name)
          }}
        />
      )}
    </>
  )
}

export default ProjectManagerPage
