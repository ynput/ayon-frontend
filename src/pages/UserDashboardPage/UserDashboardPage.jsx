import React, { useMemo, useState } from 'react'
import AppNavLinks from '@containers/header/AppNavLinks'
import { useNavigate, useParams } from 'react-router'
import UserTasksContainer from './UserDashboardTasks/UserTasksContainer'
import { Section } from '@ynput/ayon-react-components'
import ProjectList from '@containers/projectList'
import { useDispatch, useSelector } from 'react-redux'
import { onProjectSelected } from '@state/dashboard'
import { useGetProjectsInfoQuery } from '@queries/userDashboard/getUserDashboard'
import { useListProjectsQuery } from '@queries/project/getProject'
import UserDashboardNoProjects from './UserDashboardNoProjects/UserDashboardNoProjects'
import ProjectDashboard from '../ProjectDashboard'
import NewProjectDialog from '../ProjectManagerPage/NewProjectDialog'
import { useDeleteProjectMutation, useUpdateProjectMutation } from '@queries/project/updateProject'
import confirmDelete from '@helpers/confirmDelete'

const UserDashboardPage = () => {
  let { module } = useParams()
  const links = [
    {
      name: 'Tasks',
      path: '/dashboard/tasks',
      module: 'tasks',
      accessLevels: [],
      shortcut: 'H+H',
    },
    {
      name: 'Overview',
      path: '/dashboard/overview',
      module: 'overview',
      accessLevels: [],
    },
  ]

  const navigate = useNavigate()
  const [showNewProject, setShowNewProject] = useState(false)

  //   redux states
  const dispatch = useDispatch()
  //   selected projects
  const selectedProjects = useSelector((state) => state.dashboard.selectedProjects)
  const setSelectedProjects = (projects) => dispatch(onProjectSelected(projects))

  // get all the info required for the projects selected, like status icons and colours
  const { data: projectsInfo = {}, isFetching: isLoadingInfo } = useGetProjectsInfoQuery(
    { projects: selectedProjects },
    { skip: !selectedProjects?.length },
  )

  // get projects list
  const { data: projects = [], isLoading: isLoadingProjects } = useListProjectsQuery({})
  // attach projects: ['project_name'] to each projectInfo
  const projectsInfoWithProjects = useMemo(() => {
    const projectsInfoWithProjects = {}
    for (const key in projectsInfo) {
      const projectInfo = projectsInfo[key]
      projectsInfoWithProjects[key] = { ...projectInfo, projectNames: [{ id: key, name: key }] }
    }
    return projectsInfoWithProjects
  }, [projectsInfo, isLoadingInfo])

  // UPDATE/DELETE PROJECT
  const [updateProject] = useUpdateProjectMutation()
  const [deleteProject] = useDeleteProjectMutation()

  const handleDeleteProject = (sel) => {
    confirmDelete({
      label: `Project: ${sel}`,
      accept: async () => {
        await deleteProject({ projectName: sel }).unwrap()
        setSelectedProjects([])
      },
    })
  }

  const handleActivateProject = async (sel, active) => {
    await updateProject({ projectName: sel, update: { active } }).unwrap()
  }

  if (isLoadingProjects) return null

  if (!projects.length) return <UserDashboardNoProjects />

  const isProjectsMultiSelect = module === 'tasks'

  return (
    <>
      <AppNavLinks links={links} />
      <main style={{ overflow: 'hidden' }}>
        <Section direction="row" wrap style={{ position: 'relative', overflow: 'hidden' }}>
          <ProjectList
            wrap
            isCollapsible
            collapsedId="dashboard"
            styleSection={{ position: 'relative', height: '100%', minWidth: 200, maxWidth: 200 }}
            hideCode
            multiselect={isProjectsMultiSelect}
            selection={isProjectsMultiSelect ? selectedProjects : selectedProjects[0]}
            onSelect={(p) => setSelectedProjects(isProjectsMultiSelect ? p : [p])}
            onNoProject={(p) => p && setSelectedProjects([p])}
            autoSelect
            onSelectAll={
              module !== 'overview' ? (projects) => setSelectedProjects(projects) : undefined
            }
            onSelectAllDisabled={!isProjectsMultiSelect}
            isProjectManager={module === 'overview'}
            onNewProject={() => setShowNewProject(true)}
            onDeleteProject={handleDeleteProject}
            onActivateProject={handleActivateProject}
          />
          {module === 'tasks' && (
            <UserTasksContainer
              projectsInfo={projectsInfoWithProjects}
              isLoadingInfo={isLoadingInfo}
            />
          )}
          {module === 'overview' && <ProjectDashboard projectName={selectedProjects[0]} />}
        </Section>
      </main>
      {showNewProject && (
        <NewProjectDialog
          onHide={(name) => {
            setShowNewProject(false)
            if (name) navigate(`/manageProjects/anatomy?project=${name}`)
          }}
        />
      )}
    </>
  )
}

export default UserDashboardPage
