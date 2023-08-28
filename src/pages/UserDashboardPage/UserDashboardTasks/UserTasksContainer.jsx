import { useSelector } from 'react-redux'
import {
  useGetKanBanQuery,
  useGetProjectsInfoQuery,
} from '/src/services/userDashboard/getUserDashboard'
import { Section } from '@ynput/ayon-react-components'

import UserDashboardKanBan from './UserDashboardKanBan'

const UserTasksContainer = () => {
  const selectedProjects = useSelector((state) => state.dashboard.selectedProjects)
  const user = useSelector((state) => state.user)

  // get all the info required for the projects selected, like status icons and colours
  const { data: projectsInfo = {}, isFetching: isLoadingInfo } = useGetProjectsInfoQuery(
    { projects: selectedProjects },
    { skip: !selectedProjects?.length },
  )

  //  get kanban tasks for all projects by assigned user (me)
  const { data: tasks = [], isFetching: isLoadingTasks } = useGetKanBanQuery(
    { assignees: [user.name] },
    { skip: !user.name },
  )

  const isLoadingAll = isLoadingInfo || isLoadingTasks

  return (
    <Section style={{ height: '100%', zIndex: 10 }}>
      <UserDashboardKanBan tasks={tasks} isLoading={isLoadingAll} projectsInfo={projectsInfo} />
    </Section>
  )
}

export default UserTasksContainer
