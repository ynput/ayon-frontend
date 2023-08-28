import React from 'react'
import AppNavLinks from '/src/containers/header/AppNavLinks'
import { useParams } from 'react-router'
import UserTasks from './UserTasks'
import { Section } from '@ynput/ayon-react-components'
import ProjectList from '/src/containers/projectList'
import { useDispatch, useSelector } from 'react-redux'
import { onProjectSelected } from '/src/features/dashboard'

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

  return (
    <>
      <AppNavLinks links={links} />
      <main>
        <Section direction="row" wrap style={{ position: 'relative' }}>
          <ProjectList
            wrap
            isCollapsible
            styleSection={{ position: 'relative', height: '100%', minWidth: 200, maxWidth: 200 }}
            hideCode
            multiselect
            selection={selectedProjects}
            onSelect={setSelectedProjects}
            onNoProject={setSelectedProjects}
            autoSelect
          />
          {module === 'tasks' && <UserTasks />}
        </Section>
      </main>
    </>
  )
}

export default UserDashboardPage
