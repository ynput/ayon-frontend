import { Button, Panel } from '@ynput/ayon-react-components'
import React, { useEffect, useMemo } from 'react'
import DetailsPanelHeader from './DetailsPanelHeader/DetailsPanelHeader'
import { useAppDispatch, useAppSelector } from '@state/store'
import Feed from '@containers/Feed/Feed'
import { useGetEntitiesDetailsPanelQuery } from '@queries/entity/getEntityPanel'
import TaskAttributes from '@pages/UserDashboardPage/UserDashboardTasks/TaskAttributes/TaskAttributes'
import { getEntityDetailsData } from '@queries/userDashboard/userDashboardHelpers'
import DetailsPanelFiles from './DetailsPanelFiles'
import { closeSlideOut, openPip, updateDetailsPanelTab } from '@state/details'
import { entityDetailsTypesSupported } from '@/services/userDashboard/userDashboardQueries'
import * as Styled from './DetailsPanel.styled'
import EntityPath from '@components/EntityPath'
import { Watchers } from '@containers/Watchers/Watchers'
import Shortcuts from '@containers/Shortcuts'
import { isEmpty } from 'lodash'
import useGetEntityPath from './hooks/useGetEntityPath'
import { usePiPWindow } from '@context/pip/PiPProvider'
import getAllProjectStatuses from './helpers/getAllProjectsStatuses'
import { FeedProvider } from '@context/FeedContext'

export const entitiesWithoutFeed = ['product', 'representation']

const DetailsPanel = ({
  entityType,
  entitySubTypes,
  // entities is data we already have from kanban
  entitiesData = [],
  // entityIds are used to get the full details data for the entities
  entities = [],
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
  statePath = 'pinned',
  style = {},
  scope,
  isCompact = false,
  onWatchersUpdate,
}) => {
  let selectedTab = useAppSelector((state) => state.details[statePath][scope].tab)
  const dispatch = useAppDispatch()

  // if the entity type is product or representation, we show the attribs tab only
  if (entitiesWithoutFeed.includes(entityType)) selectedTab = 'attribs'

  // check if tab needs to be updated when entity type changes
  // for example when switching from version to task, task doesn't have reps tab
  // if reps tab was selected, set default to feed
  useEffect(() => {
    if (selectedTab === 'files') {
      // check entity type is still version
      if (entityType !== 'version') {
        dispatch(updateDetailsPanelTab({ statePath, tab: 'feed', scope }))
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

  // merge current entities data with fresh details data
  const entityDetailsData = getEntityDetailsData({
    entities,
    entityType,
    projectsInfo,
    detailsData,
    isSuccess,
    isError,
  })

  const allStatuses = getAllProjectStatuses(projectsInfo)

  // get the first project name and info to be used in the feed.
  const firstProject = projectNames[0]
  const firstProjectInfo = projectsInfo[firstProject] || {}
  const firstEntityData = entityDetailsData[0] || {}

  // build the full entity path for the first entity
  const [entityPathSegments, entityPathVersions] = useGetEntityPath({
    entity: firstEntityData,
    entityType,
    projectName: firstProject,
    isLoading: isFetchingEntitiesDetails,
  })

  const shortcuts = useMemo(
    () => [
      {
        key: 'Escape',
        action: () => onClose && onClose(),
      },
    ],
    [onClose],
  )

  const { requestPipWindow } = usePiPWindow()

  const handleOpenPip = () => {
    // set pip state
    dispatch(
      openPip({
        entityType: entityType,
        entities: entitiesToQuery,
        scope: scope,
        statePath: statePath,
      }),
    )

    // open pip
    requestPipWindow(500, 500)
  }

  if (!firstEntityData || isEmpty(firstEntityData)) return null

  return (
    <>
      <Shortcuts shortcuts={shortcuts || []} deps={[]} />

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
            segments={entityPathSegments}
            versions={entityPathVersions}
            projectName={firstProject}
            hideProjectName={isSlideOut}
            isLoading={isFetchingEntitiesDetails || !entityPathSegments.length}
            entityType={entityType}
            scope={scope}
          />
          <Styled.RightTools className="right-tools">
            <Watchers
              entities={entitiesToQuery}
              entityType={entityType}
              options={projectUsers}
              onWatchersUpdate={onWatchersUpdate && onWatchersUpdate}
            />
            <Button
              icon="picture_in_picture"
              variant={'text'}
              data-tooltip="Picture in Picture"
              onClick={handleOpenPip}
            />

            {onClose && (
              <Button
                icon="close"
                variant={'text'}
                onClick={() => onClose && onClose()}
                data-shortcut={onClose ? 'Escape' : undefined}
              />
            )}
          </Styled.RightTools>
        </Styled.Toolbar>

        <DetailsPanelHeader
          entityType={entityType}
          entitySubTypes={entitySubTypes}
          entities={isFetchingEntitiesDetails ? entitiesToQuery : entityDetailsData}
          users={projectUsers}
          disabledAssignees={disabledProjectUsers}
          disabledStatuses={disabledStatuses}
          tagsOptions={tagsOptions}
          isMultipleProjects={projectNames.length > 1}
          isFetching={isFetchingEntitiesDetails}
          isCompact={isCompact}
          scope={scope}
          statePath={statePath}
        />
        {selectedTab === 'feed' && !isError && (
          <FeedProvider>
            <Feed
              entityType={entityType}
              entities={isFetchingEntitiesDetails ? entitiesToQuery : entityDetailsData}
              activeUsers={activeProjectUsers}
              selectedTasksProjects={selectedTasksProjects}
              projectInfo={firstProjectInfo}
              projectName={firstProject}
              isMultiProjects={projectNames.length > 1}
              scope={scope}
              statePath={statePath}
              statuses={allStatuses}
            />
          </FeedProvider>
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
