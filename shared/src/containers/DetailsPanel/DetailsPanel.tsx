import { Button } from '@ynput/ayon-react-components'
import React, { useEffect, useMemo } from 'react'
import * as Styled from './DetailsPanel.styled'

// shared
import { useGetEntitiesDetailsPanelQuery, detailsPanelEntityTypes } from '@shared/api'
import type { ProjectModel, Tag, DetailsPanelEntityType } from '@shared/api'
import { EntityPath, Watchers } from '@shared/components'
import { usePiPWindow } from '@shared/context/pip/PiPProvider'
import { productTypes } from '@shared/util'
import { useDetailsPanelContext, useScopedDetailsPanel } from '@shared/context'
import { useVersionUploadContext } from '@shared/components/VersionUploader/context/VersionUploadContext'


import DetailsPanelHeader from './DetailsPanelHeader/DetailsPanelHeader'
import DetailsPanelFiles from './DetailsPanelFiles'
import useGetEntityPath from './hooks/useGetEntityPath'
import getAllProjectStatuses from './helpers/getAllProjectsStatuses'
import FeedWrapper from './FeedWrapper'
import FeedContextWrapper from './FeedContextWrapper'
import mergeProjectInfo from './helpers/mergeProjectInfo'

export const entitiesWithoutFeed = ['product', 'representation']

type User = { avatarUrl: string; name: string; fullName?: string }

const StyledMoreDropdown = styled(Dropdown)`
  .dropdown-content {
    min-width: 180px;
    max-width: 250px;
  }
`

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
  projectsInfo?: Record<string, ProjectModel>
  projectNames?: string[]
  isSlideOut?: boolean
  style?: React.CSSProperties
  scope: string
  isCompact?: boolean
  onClose?: () => void
  onWatchersUpdate?: (added: any[], removed: any[]) => void
  onOpenViewer?: (entity: any) => void
  onEntityFocus?: (id: string, entityType: DetailsPanelEntityType) => void
  // annotations
  annotations?: any
  removeAnnotation?: (id: string) => void
  exportAnnotationComposite?: (id: string) => Promise<Blob | null>
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
  // annotations
  annotations,
  removeAnnotation,
  exportAnnotationComposite,
}: DetailsPanelProps) => {
  const { closeSlideOut, openPip, user } = useDetailsPanelContext()
  const { currentTab, setTab, isFeed } = useScopedDetailsPanel(scope)

  // Force details tab for specific entity types
  useEffect(() => {
    if (entitiesWithoutFeed.includes(entityType) && currentTab !== 'details') {
      setTab('details')
    }
  }, [entityType, currentTab, setTab])

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
      product: Object.entries(productTypes).reduce(
        (acc, [key, product]) => ({ ...acc, [key]: product.icon }),
        {},
      ),
    }),
    [projectInfo],
  )

  // check if tab needs to be updated when entity type changes
  // for example when switching from version to task, task doesn't have reps tab
  // if reps tab was selected, set default to feed
  useEffect(() => {
    if (currentTab === 'files') {
      // check entity type is still version
      if (entityType !== 'version') {
        setTab('activity')
      }
    }
  }, [entityType, currentTab, scope])

  // now we get the full details data for selected entities
  let entitiesToQuery = entities.length
    ? entities.map((entity) => ({ id: entity.id, projectName: entity.projectName }))
    : // @ts-expect-error = not sure what's going on with entitiesData, we should try and remove it
      entitiesData.map((entity) => ({ id: entity.id, projectName: entity.projectName }))

  entitiesToQuery = entitiesToQuery.filter((entity) => entity.id)

  const {
    data: entityDetailsData = [],
    isFetching: isFetchingEntitiesDetails,
    isError,
    originalArgs,
    refetch,
  } = useGetEntitiesDetailsPanelQuery(
    { entityType, entities: entitiesToQuery },
    {
      skip: !entitiesToQuery.length || !detailsPanelEntityTypes.includes(entityType),
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
    entityType,
    projectName: firstProject,
    isLoading: isFetchingEntitiesDetails,
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if we're in an input element
      const target = e.target as HTMLElement
      const isInputElement =
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable

      if (e.key === 'Escape' && !isInputElement && onClose) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const { requestPipWindow } = usePiPWindow()

  const [showDetailsDialog, setShowDetailsDialog] = useState(false)

  let onOpenVersionUpload: any = null
  try {
    const versionUploadContext = useVersionUploadContext()
    onOpenVersionUpload = versionUploadContext.onOpenVersionUpload
  } catch (error) {
    console.log('VersionUploadProvider not available in this context')
  }

  let entityListsContext: any = null
  try {
    const { useEntityListsContext } = require('@pages/ProjectListsPage/context')
    entityListsContext = useEntityListsContext()
  } catch (error) {
    console.log('EntityListsProvider not available in this context')
  }

  const handleOpenPip = () => {
    openPip({
      entityType: entityType,
      entities: entitiesToQuery,
      scope: scope,
    })
    requestPipWindow(500, 500)
  }

  const handleUploadThumbnail = async (file: File) => {
    if (!file || !firstEntityData || !firstProject) return

    try {
      if (!file.type.includes('image')) {
        throw new Error('File is not an image')
      }

      const response = await fetch(
        `/api/projects/${firstProject}/${entityType}s/${firstEntityData.id}/thumbnail`,
        {
          method: 'POST',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to upload thumbnail')
      }

      const result = await response.json()

      console.log('Thumbnail uploaded successfully:', result)

      if (refetch) {
        await refetch()
      }

    } catch (error: any) {
      console.error('Error uploading thumbnail:', error)
    }
  }

  const moreMenuOptions = useMemo(
    () => [
      {
        value: 'picture-in-picture',
        label: 'Picture in picture',
        icon: 'picture_in_picture',
      },
      {
        value: 'upload-thumbnail',
        label: 'Upload thumbnail',
        icon: 'add_photo_alternate',
      },
      {
        value: 'upload-version',
        label: 'Upload version',
        icon: 'upload',
      },
      {
        value: 'view-details',
        label: 'View details (raw data)',
        icon: 'database',
      },
      {
        value: 'add-to-list',
        label: 'Add to list',
        icon: 'playlist_add',
      },
    ],
    [],
  )

  const handleMoreMenuAction = (value: string) => {
    switch (value) {
      case 'picture-in-picture':
        handleOpenPip()
        break
      case 'upload-thumbnail':
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0]
          if (file && firstEntityData && firstProject) {
            await handleUploadThumbnail(file)
          }
        }
        input.click()
        break
      case 'upload-version':
        if (onOpenVersionUpload && firstEntityData && firstProject) {
          const productId = firstEntityData.product?.id
          const taskId = firstEntityData.task?.id
          const folderId = firstEntityData.folder?.id

          onOpenVersionUpload({
            productId,
            taskId,
            folderId,
          })
        } else {
          console.log('Version upload not available in this context')
        }
        break
      case 'view-details':
        setShowDetailsDialog(true)
        break
      case 'add-to-list':
        if (entityListsContext && firstEntityData && firstProject) {
          const selectedEntities = [{
            entityId: firstEntityData.id,
            entityType: entityType,
          }]

          entityListsContext.openCreateNewList(entityType as any, selectedEntities)
        } else {
          console.log('Add to list not available in this context')
        }
        break
      default:
        console.log('Unknown action:', value)
    }
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
            entityType={entityType}
            scope={scope}
            // @ts-ignore
            entityTypeIcons={entityTypeIcons}
          />
          <Styled.RightTools className="right-tools">
            <StyledMoreDropdown
              options={moreMenuOptions}
              value={[]}
              placeholder=""
              onChange={(values) => handleMoreMenuAction(values[0])}
              valueTemplate={() => (
                <Button
                  icon="more_vert"
                  variant="text"
                  data-tooltip="More actions"
                />
              )}
            />
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
          entityType={entityType}
          entitySubTypes={entitySubTypes}
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
        {isFeed && !isError && (
          <FeedWrapper
            entityType={entityType}
            entities={entityDetailsData}
            activeUsers={activeProjectUsers || []}
            projectInfo={firstProjectInfo}
            projectName={firstProject}
            isMultiProjects={projectNames.length > 1}
            scope={scope}
            statuses={allStatuses}
            readOnly={false}
            annotations={annotations}
            removeAnnotation={removeAnnotation}
            exportAnnotationComposite={exportAnnotationComposite}
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
            entityType={entityType}
            entities={entityDetailsData}
            activeUsers={activeProjectUsers || []}
            projectInfo={firstProjectInfo}
            projectName={firstProject}
            isMultiProjects={projectNames.length > 1}
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
      </Styled.Panel>

      {showDetailsDialog && firstEntityData && firstProject && (
        <DetailsDialog
          projectName={firstProject}
          entityType={entityType}
          entityIds={[firstEntityData.id]}
          visible={showDetailsDialog}
          onHide={() => setShowDetailsDialog(false)}
        />
      )}
    </>
  )
}
