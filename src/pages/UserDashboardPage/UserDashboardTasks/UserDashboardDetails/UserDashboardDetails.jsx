import { Panel } from '@ynput/ayon-react-components'
import React from 'react'
import UserDashDetailsHeader from '../UserDashDetailsHeader/UserDashDetailsHeader'
import { useSelector } from 'react-redux'
import Feed from '/src/containers/Feed/Feed'
import { useGetDashboardEntitiesDetailsQuery } from '/src/services/userDashboard/getUserDashboard'
import TaskAttributes from '../TaskAttributes/TaskAttributes'

const UserDashboardDetails = ({
  entityType,
  entities = [],
  entityIds = [],
  statusesOptions = [],
  tagsOptions = [],
  disabledStatuses,
  projectUsers,
  disabledProjectUsers,
  activeProjectUsers,
  selectedTasksProjects,
  projectInfo,
  projectName,
  onClose,
}) => {
  const filter = useSelector((state) => state.dashboard.details.filter)
  // now we get the full details data for selected entities
  const {
    data,
    isFetching: isLoadingTasksDetails,
    isSuccess,
    isError,
  } = useGetDashboardEntitiesDetailsQuery(
    { entities, entityType, entityIds, projectName },
    { skip: !entities.length && !entityIds.length },
  )

  let entityDetailsData = []
  // merge current entities data with fresh details data
  if (!isSuccess || isError) {
    if (entityIds.length) entityDetailsData = entityIds.map((id) => ({ id }))
    else entityDetailsData = entities
  } else entityDetailsData = data

  return (
    <>
      <Panel
        style={{
          gap: 0,
          height: '100%',
          padding: 0,
          boxShadow: '-2px 0 6px #00000047',
          zIndex: 80,
        }}
      >
        <UserDashDetailsHeader
          entityType={entityType}
          entities={entityDetailsData}
          users={projectUsers}
          disabledAssignees={disabledProjectUsers}
          statusesOptions={statusesOptions}
          disabledStatuses={disabledStatuses}
          tagsOptions={tagsOptions}
          onClose={onClose}
        />
        {filter === 'details' ? (
          <TaskAttributes
            entityType={entityType}
            entities={entityDetailsData}
            isLoading={isLoadingTasksDetails}
          />
        ) : (
          <Feed
            entityType={entityType}
            entities={entityDetailsData}
            activeUsers={activeProjectUsers}
            selectedTasksProjects={selectedTasksProjects}
            projectInfo={projectInfo}
            projectName={projectName}
            filter={filter}
          />
        )}
      </Panel>
    </>
  )
}

export default UserDashboardDetails
