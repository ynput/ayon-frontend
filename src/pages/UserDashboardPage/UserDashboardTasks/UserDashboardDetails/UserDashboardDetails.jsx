import { Panel } from '@ynput/ayon-react-components'
import React from 'react'
import UserDashDetailsHeader from '../UserDashDetailsHeader/UserDashDetailsHeader'
import { useSelector } from 'react-redux'
import Feed from '/src/containers/Feed/Feed'
import { useGetDashboardEntitiesDetailsQuery } from '/src/services/userDashboard/getUserDashboard'
import TaskAttributes from '../TaskAttributes/TaskAttributes'
import { transformEntityData } from '/src/services/userDashboard/userDashboardHelpers'

const UserDashboardDetails = ({
  entityType,
  // entities is data we already have from kanban
  entities = [],
  // entityIds are used to get the full details data for the entities
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
  isSlideOut,
  style = {},
}) => {
  const path = isSlideOut ? 'slideOut' : 'details'
  const attributesOpen = useSelector((state) => state.dashboard[path].attributesOpen)
  // now we get the full details data for selected entities

  const entitiesToQuery = entityIds.length
    ? entityIds.map((id) => ({ id, projectName }))
    : entities.map((entity) => ({ id: entity.id, projectName: entity.projectName }))

  const {
    data: detailsData = {},
    isFetching: isLoadingEntitiesDetails,
    isSuccess,
    isError,
  } = useGetDashboardEntitiesDetailsQuery(
    { entityType, entities: entitiesToQuery, projectInfo },
    { skip: !entities.length && !entityIds.length },
  )

  let entityDetailsData = []
  // merge current entities data with fresh details data
  if (!isSuccess || isError) {
    if (entityIds.length) entityDetailsData = entityIds.map((id) => ({ id }))
    else
      entityDetailsData = entities.map((entity) =>
        transformEntityData({ entity, entityType, projectName, projectInfo }),
      )
  } else entityDetailsData = detailsData

  return (
    <>
      <Panel
        style={{
          gap: 0,
          height: '100%',
          padding: 0,
          boxShadow: '-2px 0 6px #00000047',
          zIndex: 80,
          ...style,
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
          isSlideOut={isSlideOut}
        />
        {attributesOpen ? (
          <TaskAttributes
            entityType={entityType}
            entities={entityDetailsData}
            isLoading={isLoadingEntitiesDetails}
          />
        ) : (
          <Feed
            entityType={entityType}
            entities={entityDetailsData}
            activeUsers={activeProjectUsers}
            selectedTasksProjects={selectedTasksProjects}
            projectInfo={projectInfo}
            projectName={projectName}
            isSlideOut={isSlideOut}
          />
        )}
      </Panel>
    </>
  )
}

export default UserDashboardDetails
