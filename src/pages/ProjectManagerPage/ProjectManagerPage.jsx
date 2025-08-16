import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { StringParam, useQueryParam, withDefault } from 'use-query-params'

import AddonSettings from '@containers/AddonSettings'

import ProjectAnatomy from './ProjectAnatomy'
import ProjectRoots from './ProjectRoots'
import NewProjectDialog from './NewProjectDialog'

import { selectProject } from '@state/context'
import { useDeleteProjectMutation, useUpdateProjectMutation } from '@shared/api'
import TeamsPage from '../TeamsPage'
import ProjectManagerPageContainer from './ProjectManagerPageContainer'
import ProjectManagerPageLayout from './ProjectManagerPageLayout'
import AppNavLinks from '@containers/header/AppNavLinks'
import { confirmDelete } from '@shared/util'
import useUserProjectPermissions, { UserPermissionsEntity } from '@hooks/useUserProjectPermissions'
import ProjectUserAccess from './Users/ProjectUserAccess'
import ProjectPermissions from './ProjectPermissions'
import { isActiveDecider, projectSorter, Module, ModuleList, ModulePath } from './mappers'
import { replaceQueryParams } from '@helpers/url'

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
      <AddonSettings projectName={projectName} showSites bypassPermissions />
    </ProjectManagerPageLayout>
  )
}

const ProjectManagerPage = () => {
  const isUser = useSelector((state) => state.user.data.isUser)
  const projectName = useSelector((state) => state.project.name)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  let { module } = useParams()

  const [showNewProject, setShowNewProject] = useState(false)

  // QUERY PARAMS STATE
  const [selectedProject, setSelectedProject] = useQueryParam(
    'project',
    withDefault(StringParam, projectName),
  )

  const { isLoading: isLoadingUserPermissions, permissions: userPermissions } =
    useUserProjectPermissions(isUser)

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
    await updateProject({ projectName: sel, projectPatchModel: { active } }).unwrap()
  }

  const links = []
  if (!isUser || (!isLoadingUserPermissions && userPermissions.projectSettingsAreEnabled())) {
    if (userPermissions.canViewAny(UserPermissionsEntity.anatomy) || module === Module.anatomy) {
      links.push({
        name: 'Anatomy',
        path: ModulePath[Module.anatomy],
        module: Module.anatomy,
        accessLevels: [],
        shortcut: 'A+A',
      })
    }

    if (
      userPermissions.canViewAny(UserPermissionsEntity.settings) ||
      module === Module.projectSettings
    ) {
      links.push({
        name: 'Project settings',
        path: ModulePath[Module.projectSettings],
        module: Module.projectSettings,
        accessLevels: [],
        shortcut: 'P+P',
      })
    }

    links.push({
      name: 'Project permissions',
      path: ModulePath[Module.permissions],
      module: Module.permissions,
      accessLevels: ['manager'],
    })

    if (
      userPermissions.canViewAny(UserPermissionsEntity.access) ||
      module === Module.projectAccess
    ) {
      links.push({
        name: 'Project access',
        path: ModulePath[Module.projectAccess],
        module: Module.projectAccess,
        accessLevels: [],
      })
    }
  }

  links.push(
    {
      name: 'Site settings',
      path: ModulePath[Module.siteSettings],
      module: Module.siteSettings,
      accessLevels: [],
    },
    {
      name: 'Roots',
      path: ModulePath[Module.roots],
      module: Module.roots,
      accessLevels: [],
    },
    {
      name: 'Teams',
      path: ModulePath[Module.teams],
      module: Module.teams,
      accessLevels: ['manager'],
    },
  )

  const linksWithProject = useMemo(
    () =>
      links.map((link) => ({
        ...link,
        path: replaceQueryParams(link.path, selectedProject ? { project: selectedProject } : {}),
      })),
    [links, selectedProject],
  )

  useEffect(() => {
    if (isLoadingUserPermissions || module !== undefined) {
      return
    }

    for (const item of ModuleList) {
      if (userPermissions.canAccessModule({ module: item, projectName: selectedProject })) {
        navigate(replaceQueryParams(ModulePath[item], { project: selectedProject }))
        return
      }
    }
  }, [isLoadingUserPermissions, selectedProject, module])

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
        customSort={projectSorter({ isLoadingUserPermissions, userPermissions, module })}
        isActiveCallable={isActiveDecider({ userPermissions, projectName, module })}
      >
        {module === Module.anatomy && <ProjectAnatomy />}
        {module === Module.projectSettings && <ProjectSettings />}
        {module === Module.siteSettings && <SiteSettings />}
        {module === Module.projectAccess && <ProjectUserAccess onSelect={setSelectedProject} />}
        {module === Module.roots && <ProjectRoots userPermissions={userPermissions} />}
        {module === Module.teams && <TeamsPage />}
        {module === Module.permissions && <ProjectPermissions />}
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
