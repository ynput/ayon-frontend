import { Button } from '@ynput/ayon-react-components'
import React, { useEffect, useMemo, useRef } from 'react'
import * as Styled from './DetailsPanel.styled'

// shared
import { useGetEntitiesDetailsPanelQuery, detailsPanelEntityTypes } from '@shared/api'
import type { Tag, DetailsPanelEntityType } from '@shared/api'
import { DetailsPanelDetails, EntityPath, Watchers } from '@shared/components'
import { usePiPWindow } from '@shared/context/pip/PiPProvider'
import {
  ProjectContextProvider,
  ProjectModelWithProducts,
  useDetailsPanelContext,
  useScopedDetailsPanel,
} from '@shared/context'

import DetailsPanelHeader from './DetailsPanelHeader/DetailsPanelHeader'
import DetailsPanelFiles from './DetailsPanelFiles'
import useGetEntityPath from './hooks/useGetEntityPath'
import getAllProjectStatuses from './helpers/getAllProjectsStatuses'
import FeedWrapper from './FeedWrapper'
import FeedContextWrapper from './FeedContextWrapper'
import mergeProjectInfo from './helpers/mergeProjectInfo'

export const entitiesWithoutFeed = ['product', 'representation']

type User = { avatarUrl: string; name: string; fullName?: string }

export type DetailsPanelProps = {
  entityType: DetailsPanelEntityType
  entitySubTypes?: string[] // used to get actions before the entity has loaded
  entitiesData?: { id: string; label: string; type: DetailsPanelEntityType }[]
  entities?: { id: string; projectName: string }[]
  tagsOptions?: Tag[]
  disabledStatuses?: string[]
  projectUsers?: User[]
  disabledProjectUsers?: string[]
  activeProjectUsers?: string[]
  projectsInfo?: Record<string, ProjectModelWithProducts>
  projectNames?: string[]
  isSlideOut?: boolean
  style?: React.CSSProperties
  scope: string
  isCompact?: boolean
  onClose?: () => void
  onWatchersUpdate?: (added: any[], removed: any[]) => void
  onOpenViewer?: (entity: any) => void
  onEntityFocus?: (id: string, entityType: DetailsPanelEntityType) => void
  onOpen?: () => void
  // annotations
  annotations?: any
  removeAnnotation?: (id: string) => void
  exportAnnotationComposite?: (id: string) => Promise<Blob | null>
  entityListId?: string
  guestCategories?: Record<string, string> // only used for guests to find if they have access to any categories
  // optional tab state for independent tab management
}

export const DetailsPanel = ({
  entityType,
  entitySubTypes = [],
  // entities is data we already have from kanban
  entitiesData = [],
  // entityIds are used to get the full details data for the entities
  entities = [],
  tagsOptions = [],
  disabledStatuses,
  projectUsers,
  disabledProjectUsers,
  activeProjectUsers,
  projectsInfo = {},
  projectNames = [],
  isSlideOut = false,
  style = {},
  scope,
  isCompact = false,
  onClose,
  onWatchersUpdate,
  onOpenViewer,
  onEntityFocus,
  onOpen,
  // annotations
  annotations,
  removeAnnotation,
  exportAnnotationComposite,
  entityListId,
  guestCategories = {},
}: // optional tab state for independent tab management
DetailsPanelProps) => {
  const {
    closeSlideOut,
    openPip,
    user,
    isGuest,
    entities: contextEntities,
  } = useDetailsPanelContext()
  const { currentTab, setTab, isFeed } = useScopedDetailsPanel(scope)
  const hasCalledOnOpen = useRef(false)

  // Use context entities if available, otherwise use props
  const activeEntityType = contextEntities?.entityType ?? entityType
  const activeEntities = contextEntities?.entities ?? entities
  const activeEntitySubTypes = contextEntities?.entitySubTypes ?? entitySubTypes

  // Fire onOpen callback once when component mounts and renders
  useEffect(() => {
    if (onOpen && !hasCalledOnOpen.current) {
      hasCalledOnOpen.current = true
      onOpen()
    }
  }, [])

  // Force details tab for specific entity types
  useEffect(() => {
    if (entitiesWithoutFeed.includes(activeEntityType) && currentTab !== 'details') {
      setTab('details')
    }
  }, [activeEntityType, currentTab, setTab])

  // reduce projectsInfo to selected projects and into one
  const projectInfo = useMemo(
    () => mergeProjectInfo(projectsInfo, projectNames),
    [projectsInfo, projectNames],
  )

  // build icons for entity types
  const entityTypeIcons = useMemo(
    () => ({
      task: projectInfo.taskTypes
        .filter((task) => !!task.icon)
        .reduce((acc, task) => ({ ...acc, [task.name]: task.icon }), {}),
      folder: projectInfo.folderTypes
        .filter((folder) => !!folder.icon)
        .reduce((acc, folder) => ({ ...acc, [folder.name]: folder.icon }), {}),
      product: projectInfo.productTypes
        .filter((product) => !!product.icon)
        .reduce((acc, product) => ({ ...acc, [product.name]: product.icon }), {}),
    }),
    [projectInfo],
  )

  // check if tab needs to be updated when entity type changes
  // for example when switching from version to task, task doesn't have reps tab
  // if reps tab was selected, set default to feed
  useEffect(() => {
    if (currentTab === 'files') {
      // check entity type is still version
      if (activeEntityType !== 'version') {
        setTab('activity')
      }
    }
  }, [activeEntityType, currentTab, scope])

  // now we get the full details data for selected entities
  let entitiesToQuery = activeEntities.length
    ? activeEntities.map((entity) => ({ id: entity.id, projectName: entity.projectName }))
    : // @ts-expect-error = not sure what's going on with entitiesData, we should try and remove it
      entitiesData.map((entity) => ({ id: entity.id, projectName: entity.projectName }))

  entitiesToQuery = entitiesToQuery.filter((entity) => entity.id)

  const {
    data: entityDetailsData = [],
    isFetching: isFetchingEntitiesDetails,
    isError,
    originalArgs,
  } = useGetEntitiesDetailsPanelQuery(
    { entityType: activeEntityType, entities: entitiesToQuery },
    {
      skip: !entitiesToQuery.length || !detailsPanelEntityTypes.includes(activeEntityType),
    },
  )

  // the entity changes then we close the slide out
  useEffect(() => {
    if (!isSlideOut) {
      closeSlideOut()
    }
  }, [originalArgs, isSlideOut])

  // TODO:  merge current entities data with fresh details data

  const allStatuses = getAllProjectStatuses(projectsInfo)

  // get the first project name and info to be used in the feed.
  const firstProject = projectNames[0]
  const firstProjectInfo = projectsInfo[firstProject] || {}
  const firstEntityData = entityDetailsData[0] || {}

  // build the full entity path for the first entity
  const [entityPathSegments, entityPathVersions] = useGetEntityPath({
    entity: firstEntityData,
    entityType: activeEntityType,
    projectName: firstProject,
    isLoading: isFetchingEntitiesDetails,
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        // Don't trigger if we're in an input element
        const target = e.target as HTMLElement
        const isInputElement =
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable

        if (!isInputElement) return

        // don't trigger if the viewer is open and panel not in slideout mode
        if (isSlideOut === false && target.closest('#viewer-dialog')) return

        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, isSlideOut])

  const { requestPipWindow } = usePiPWindow()

  const handleOpenPip = () => {
    openPip({
      entityType: activeEntityType,
      entities: entitiesToQuery,
      scope: scope,
    })
    requestPipWindow(500, 500)
  }

  const isCommentingEnabled = () => {
    // cannot comment on multiple projects
    if (projectNames.length > 1) return false
    if (isGuest) {
      // Guest can only comment in review sessions (for now)
      if (!entityListId) return false
      // Guest must have at least one category set for list
      const guestHasCategory = Object.prototype.hasOwnProperty.call(
        guestCategories,
        user.attrib?.email || '',
      )
      if (!guestHasCategory) return false
    }
    return true
  }

  return (
    <>
      <Styled.Panel className="details-panel">
        <Styled.Toolbar>
          {/* TODO FIX PATH */}
          <EntityPath
            segments={entityPathSegments}
            versions={entityPathVersions}
            projectName={firstProject}
            hideProjectName={isSlideOut}
            isLoading={isFetchingEntitiesDetails || !entityPathSegments.length}
            entityType={activeEntityType}
            scope={scope}
            // @ts-ignore
            entityTypeIcons={entityTypeIcons}
          />
          <Styled.RightTools className="right-tools">
            <Watchers
              entities={entitiesToQuery}
              entityType={entityType}
              options={projectUsers || []}
              onWatchersUpdate={onWatchersUpdate && onWatchersUpdate}
              userName={user.name}
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
                data-shortcut={'Escape'}
              />
            )}
          </Styled.RightTools>
        </Styled.Toolbar>

        <DetailsPanelHeader
          entityType={activeEntityType}
          entitySubTypes={activeEntitySubTypes}
          entities={entityDetailsData}
          users={projectUsers}
          disabledAssignees={disabledProjectUsers}
          disabledStatuses={disabledStatuses}
          tagsOptions={tagsOptions}
          isFetching={isFetchingEntitiesDetails}
          isCompact={isCompact}
          currentTab={currentTab}
          onTabChange={setTab}
          entityTypeIcons={entityTypeIcons}
          onOpenViewer={(args) => onOpenViewer?.(args)}
          onEntityFocus={onEntityFocus}
        />
        <ProjectContextProvider projectName={firstProject}>
          {isFeed && !isError && (
            <FeedWrapper
              entityType={activeEntityType}
              entities={entityDetailsData}
              activeUsers={activeProjectUsers || []}
              projectInfo={firstProjectInfo}
              projectName={firstProject}
              disabled={!isCommentingEnabled()}
              scope={scope}
              statuses={allStatuses}
              readOnly={false}
              entityListId={entityListId}
              annotations={annotations}
              removeAnnotation={removeAnnotation}
              exportAnnotationComposite={exportAnnotationComposite}
              currentTab={currentTab}
              setCurrentTab={setTab}
            />
          )}
          {currentTab === 'files' && (
            <DetailsPanelFiles
              entities={entityDetailsData}
              scope={scope}
              isLoadingVersion={isFetchingEntitiesDetails}
            />
          )}
          {currentTab === 'details' && (
            <FeedContextWrapper
              entityType={activeEntityType}
              entities={entityDetailsData}
              activeUsers={activeProjectUsers || []}
              projectInfo={firstProjectInfo}
              projectName={firstProject}
              disabled={!isCommentingEnabled()}
              scope={scope}
              statuses={allStatuses}
              readOnly={false}
              annotations={annotations}
              removeAnnotation={removeAnnotation}
              exportAnnotationComposite={exportAnnotationComposite}
            >
              <DetailsPanelDetails
                entities={entityDetailsData}
                isLoading={isFetchingEntitiesDetails}
              />
            </FeedContextWrapper>
          )}
        </ProjectContextProvider>
      </Styled.Panel>
    </>
  )
}
