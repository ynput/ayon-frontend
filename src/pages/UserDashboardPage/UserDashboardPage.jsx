import React, { useMemo } from 'react'
import AppNavLinks from '/src/containers/header/AppNavLinks'
import { useParams } from 'react-router'
import UserTasksContainer from './UserDashboardTasks/UserTasksContainer'
import { Section } from '@ynput/ayon-react-components'
import ProjectList from '/src/containers/projectList'
import { useDispatch, useSelector } from 'react-redux'
import { onProjectSelected } from '/src/features/dashboard'
import { useGetProjectsInfoQuery } from '/src/services/userDashboard/getUserDashboard'
import { useGetAllProjectsQuery } from '/src/services/project/getProject'
import UserDashboardNoProjects from './UserDashboardNoProjects/UserDashboardNoProjects'
import ProjectDashboard from '../ProjectDashboard'

const UserDashboardPage = () => {
  let { module } = useParams()
  const links = [
    {
      name: 'Tasks',
      path: '/dashboard/tasks',
      module: 'tasks',
      accessLevels: [],
    },
    {
      name: 'Overview',
      path: '/dashboard/overview',
      module: 'overview',
      accessLevels: [],
    },
  ]

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
  const { data: projects = [], isLoading: isLoadingProjects } = useGetAllProjectsQuery()
  // attach projects: ['project_name'] to each projectInfo
  const projectsInfoWithProjects = useMemo(() => {
    const projectsInfoWithProjects = {}
    for (const key in projectsInfo) {
      const projectInfo = projectsInfo[key]
      projectsInfoWithProjects[key] = { ...projectInfo, projectNames: [{ id: key, name: key }] }
    }
    return projectsInfoWithProjects
  }, [projectsInfo, isLoadingInfo])

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
            onSelectAll={(projects) => setSelectedProjects(projects)}
            onSelectAllDisabled={!isProjectsMultiSelect}
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
    </>
  )
}

export default UserDashboardPage
