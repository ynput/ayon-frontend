import { Button, Panel } from '@ynput/ayon-react-components'
import React, { useEffect, useMemo } from 'react'
import DetailsPanelHeader from './DetailsPanelHeader/DetailsPanelHeader'
import { useDispatch, useSelector } from 'react-redux'
import Feed from '@containers/Feed/Feed'
import { useGetEntitiesDetailsPanelQuery } from '@queries/entity/getEntityPanel'
import TaskAttributes from '@pages/UserDashboardPage/UserDashboardTasks/TaskAttributes/TaskAttributes'
import { transformEntityData } from '@queries/userDashboard/userDashboardHelpers'
import DetailsPanelFiles from './DetailsPanelFiles'
import { closeSlideOut, updateDetailsPanelTab } from '@state/details'
import { entityDetailsTypesSupported } from '@/services/userDashboard/userDashboardQueries'
import getEntityPathData from './helpers/getEntityPathData'
import * as Styled from './DetailsPanel.styled'
import EntityPath from '@components/EntityPath'
import { Watchers } from '@containers/Watchers/Watchers'
import Shortcuts from '@containers/Shortcuts'
import { isEmpty } from 'lodash'

export const entitiesWithoutFeed = ['product', 'representation']

const DetailsPanel = ({
  entityType,
  entitySubTypes,
  // entities is data we already have from kanban
  entitiesData = [],
  // entityIds are used to get the full details data for the entities
  entities = [],
  statusesOptions = [],
  tagsOptions = [],
  disabledStatuses,
  projectUsers,
  disabledProjectUsers,
  activeProjectUsers,
  selectedTasksProjects,
  projectsInfo = {},
  projectNames = [],
  onClose,
  isSlideOut = false,
  style = {},
  scope,
  isCompact = false,
}) => {
  const path = isSlideOut ? 'slideOut' : 'pinned'
  let selectedTab = useSelector((state) => state.details[path][scope].tab)
  const dispatch = useDispatch()

  // if the entity type is product or representation, we show the attribs tab only
  if (entitiesWithoutFeed.includes(entityType)) selectedTab = 'attribs'

  // check if tab needs to be updated when entity type changes
  // for example when switching from version to task, task doesn't have reps tab
  // if reps tab was selected, set default to feed
  useEffect(() => {
    if (selectedTab === 'files') {
      // check entity type is still version
      if (entityType !== 'version') {
        dispatch(updateDetailsPanelTab({ isSlideOut, tab: 'feed', scope }))
      }
    }
  }, [entityType, selectedTab])

  // now we get the full details data for selected entities
  let entitiesToQuery = entities.length
    ? entities.map((entity) => ({ id: entity.id, projectName: entity.projectName }))
    : entitiesData.map((entity) => ({ id: entity.id, projectName: entity.projectName }))

  entitiesToQuery = entitiesToQuery.filter((entity) => entity.id)

  const {
    data: detailsData = [],
    isFetching: isFetchingEntitiesDetails,
    isSuccess,
    isError,
    originalArgs,
  } = useGetEntitiesDetailsPanelQuery(
    { entityType, entities: entitiesToQuery, projectsInfo },
    {
      skip: !entitiesToQuery.length || !entityDetailsTypesSupported.includes(entityType),
    },
  )

  // the entity changes then we close the slide out
  useEffect(() => {
    if (!isSlideOut) {
      dispatch(closeSlideOut())
    }
  }, [originalArgs])

  let entityDetailsData = []
  // merge current entities data with fresh details data
  if (!isSuccess || isError) {
    if (entities.length) entityDetailsData = entities.map(({ id }) => ({ id }))
    else
      entityDetailsData = entities.map((entity) =>
        transformEntityData({
          entity,
          entityType,
          projectName: entity.projectName,
          projectInfo: projectsInfo[entity.projectName],
        }),
      )
  } else entityDetailsData = detailsData

  // get the first project name and info to be used in the feed.
  const firstProject = projectNames[0]
  const firstProjectInfo = projectsInfo[firstProject] || {}
  const firstEntityData = entityDetailsData[0] || {}

  const shortcuts = useMemo(
    () => [
      {
        key: 'Escape',
        action: () => onClose && onClose(),
      },
    ],
    [onClose],
  )

  if (!firstEntityData || isEmpty(firstEntityData)) return null

  return (
    <>
      <Shortcuts shortcuts={shortcuts} deps={[]} />
      <Panel
        style={{
          gap: 0,
          height: '100%',
          padding: 0,
          boxShadow: '-2px 0 6px #00000047',
          zIndex: 300,
          ...style,
        }}
        className="details-panel"
      >
        <Styled.Toolbar>
          <EntityPath
            segments={getEntityPathData(firstEntityData)}
            projectName={firstProject}
            isLoading={isFetchingEntitiesDetails}
          />
          <Watchers entities={entitiesToQuery} entityType={entityType} options={projectUsers} />
          {onClose && (
            <Button
              icon="close"
              variant={'text'}
              onClick={() => onClose && onClose()}
              data-shortcut={onClose ? 'Escape' : undefined}
            />
          )}
        </Styled.Toolbar>

        <DetailsPanelHeader
          entityType={entityType}
          entitySubTypes={entitySubTypes}
          entities={isFetchingEntitiesDetails ? entitiesToQuery : entityDetailsData}
          users={projectUsers}
          disabledAssignees={disabledProjectUsers}
          statusesOptions={statusesOptions}
          disabledStatuses={disabledStatuses}
          tagsOptions={tagsOptions}
          isSlideOut={isSlideOut}
          isMultipleProjects={projectNames.length > 1}
          isFetching={isFetchingEntitiesDetails}
          isCompact={isCompact}
          scope={scope}
        />
        {selectedTab === 'feed' && !isError && (
          <Feed
            entityType={entityType}
            entities={isFetchingEntitiesDetails ? entitiesToQuery : entityDetailsData}
            activeUsers={activeProjectUsers}
            selectedTasksProjects={selectedTasksProjects}
            projectInfo={firstProjectInfo}
            projectName={firstProject}
            isMultiProjects={projectNames.length > 1}
            isSlideOut={isSlideOut}
            scope={scope}
          />
        )}
        {selectedTab === 'files' && (
          <DetailsPanelFiles
            entities={entityDetailsData}
            scope={scope}
            isLoadingVersion={isFetchingEntitiesDetails}
          />
        )}
        {selectedTab === 'attribs' && (
          <TaskAttributes
            entityType={entityType}
            entities={entityDetailsData}
            isLoading={isFetchingEntitiesDetails}
          />
        )}
      </Panel>
    </>
  )
}

export default DetailsPanel
