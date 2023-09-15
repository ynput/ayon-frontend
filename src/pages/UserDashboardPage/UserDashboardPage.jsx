import React from 'react'
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

const UserDashboardPage = () => {
  let { module } = useParams()
  const links = [
    {
      name: 'Tasks',
      path: '/dashboard/tasks',
      module: 'tasks',
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

  if (isLoadingProjects) return null

  if (!projects.length) return <UserDashboardNoProjects />

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
            multiselect
            selection={selectedProjects}
            onSelect={setSelectedProjects}
            onNoProject={(p) => p && setSelectedProjects(p)}
            autoSelect
            onSelectAll={(projects) => setSelectedProjects(projects)}
          />
          {module === 'tasks' && (
            <UserTasksContainer projectsInfo={projectsInfo} isLoadingInfo={isLoadingInfo} />
          )}
        </Section>
      </main>
    </>
  )
}

export default UserDashboardPage
