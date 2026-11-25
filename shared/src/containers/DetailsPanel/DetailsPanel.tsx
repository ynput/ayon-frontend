import React, { useEffect, useMemo, useRef, useState } from 'react'
import useDetailsPanelURLSync from './hooks/useDetailsPanelURLSync'
import * as Styled from './DetailsPanel.styled'

// shared
import { useGetEntitiesDetailsPanelQuery, detailsPanelEntityTypes } from '@shared/api'
import type { Tag, DetailsPanelEntityType, DetailsPanelEntityData } from '@shared/api'
import { DetailsPanelDetails } from '@shared/components/DetailsPanelDetails/DetailsPanelDetails'
import { EntityPath } from '@shared/components/EntityPath/EntityPath'
import { Watchers } from '@shared/components/Watchers/Watchers'
import {
  ACTIVE_ENTITIES_PRIORITY,
  extractEntityHierarchyFromParents,
  useRegisterActiveEntities,
} from '@shared/util'
import {
  usePiPWindow,
  ProjectContextProvider,
  ThumbnailUploadProvider,
  useDetailsPanelContext,
  useScopedDetailsPanel,
  setDetailsPanelTabForScope,
  isAddonDetailsPanelTab,
  useURIContext,
  type ProjectModelWithProducts,
  type FeedFilter,
  type DetailsPanelTab,
} from '@shared/context'

import DetailsPanelHeader from './components/DetailsPanelHeader/DetailsPanelHeader'
import DetailsPanelFiles from './components/DetailsPanelFiles'
import NewerVersionBanner, { type ResolveVersionJump } from './components/NewerVersionBanner'
import { getNewerLatestVersion } from './components/NewerVersionBanner/NewerVersionBannerHelpers'
import {
  useDetailsPanelMoreMenu,
  type DetailsPanelEntityListsContext,
} from './components/DetailsPanelMoreMenu'
import { isDetailsPipPage } from './components/DetailsPanelFloating/detailsPip'
import useGetEntityPath from './hooks/useGetEntityPath'
import getAllProjectStatuses from './helpers/getAllProjectsStatuses'
import FeedWrapper from './containers/FeedWrapper'
import FeedContextWrapper from './containers/FeedContextWrapper'
import mergeProjectInfo from './helpers/mergeProjectInfo'
import buildEntityTypeIcons from './helpers/buildEntityTypeIcons'
import DetailsPanelSubtasks from './containers/DetailsPanelSubtasks'
import { DetailsPanelTasks } from './components/DetailsPanelTasks'
import { entitiesWithoutFeed } from './DetailsPanelHelpers'
import { useDetailsPanelTabSlot } from './hooks/useDetailsPanelTabSlot'
import { PanelTabSearch } from '@shared/components/PanelTabs'
import { TabbedPanel, type TabbedPanelTab } from '@shared/components/TabbedPanel'

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
  activeProjectUsers?: User[]
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
  onUriOpen?: (entity: DetailsPanelEntityData, source: 'uri' | 'url') => void
  // annotations
  annotations?: any
  removeAnnotation?: (id: string) => void
  exportAnnotationComposite?: (id: string) => Promise<Blob | null>
  entityListId?: string
  guestCategories?: Record<string, string> // only used for guests to find if they have access to any categories
  /** Optional EntityListsContext for the "Add to list" sub-menu in the more-menu.
   *  Hosts that already mount EntityListsProvider can pass the resolved context here;
   *  otherwise wrap the panel with EntityListsContextBoundary. The shape mirrors
   *  `EntityListsContextType` from `src/pages/ProjectListsPage/context` — it lives as a
   *  structural type in shared/ so the layering rule (shared cannot import src/pages)
   *  is preserved. */
  entityListsContext?: DetailsPanelEntityListsContext
  resolveVersionJump?: ResolveVersionJump
  /** the thumbnail across the panel's width below the path, instead of next to the name */
  wideThumbnail?: boolean
  /**
   * false for a panel that only shows the entities it is given (a preview, e.g. in a dialog): it
   * leaves the page alone, so the page's URL, URI, its panel's entities and slide-out stay as they are
   */
  syncWithPage?: boolean
  // optional tab state for independent tab management
}

const DetailsPanelInner = ({
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
  onUriOpen, // when the details panel is opened from uri
  // annotations
  annotations,
  removeAnnotation,
  exportAnnotationComposite,
  entityListId,
  guestCategories = {},
  entityListsContext,
  resolveVersionJump,
  wideThumbnail = false,
  syncWithPage = true,
}: // optional tab state for independent tab management
DetailsPanelProps) => {
  const {
    closeSlideOut,
    openPip,
    user,
    isGuest,
    entities: pageEntities,
    setEntities,
    slideOut,
    useSearchParams,
    SubtasksManager,
    useNavigate,
  } = useDetailsPanelContext()
  const { currentTab, setTab } = useScopedDetailsPanel(scope)
  // the Details tab's search: it stays while the selection changes, as the feed's filters do
  const [detailsSearch, setDetailsSearch] = useState('')
  const [_searchParams, setSearchParams] = useSearchParams()
  const hasCalledOnOpen = useRef(false)

  // a panel that leaves the page alone shows only its own entities
  const contextEntities = syncWithPage ? pageEntities : null
  // Use context entities if available, otherwise use props
  const activeEntityType = contextEntities?.entityType ?? entityType
  const activeEntities = contextEntities?.entities ?? entities
  const activeEntitySubTypes = contextEntities?.entitySubTypes ?? entitySubTypes
  const activeEntitiesData = contextEntities?.entities ? [] : entitiesData
  const activeProjectNames = contextEntities?.entities
    ? contextEntities.entities.map((e) => e.projectName)
    : projectNames

  // let global features (e.g. the links dialog) know what is being shown
  useRegisterActiveEntities(
    activeEntityType && syncWithPage
      ? activeEntities.map((e) => ({ ...e, entityType: activeEntityType }))
      : [],
    isSlideOut ? ACTIVE_ENTITIES_PRIORITY.slideOut : ACTIVE_ENTITIES_PRIORITY.detailsPanel,
  )

  // Fire onOpen callback once when component mounts and renders
  useEffect(() => {
    if (onOpen && !hasCalledOnOpen.current) {
      hasCalledOnOpen.current = true
      onOpen()
    }
  }, [])

  // addon tabs (detailsPanel.tab slot) for this entity type
  const {
    slot: addonTabSlot,
    tabs: addonTabs,
    isLoading: isLoadingAddonTabs,
  } = useDetailsPanelTabSlot(activeEntityType)
  const activeAddonTab = addonTabs.find((tab) => tab.key === currentTab)
  // a stored addon tab is only known once the manifests have loaded
  const isPendingAddonTab = isAddonDetailsPanelTab(currentTab) && isLoadingAddonTabs

  // Force details tab for specific entity types
  useEffect(() => {
    if (
      entitiesWithoutFeed.includes(activeEntityType) &&
      currentTab !== 'details' &&
      !activeAddonTab &&
      !isPendingAddonTab
    ) {
      setTab('details')
    }
  }, [activeEntityType, currentTab, setTab, activeAddonTab, isPendingAddonTab])

  // once component is provided with specific entities, remove context entities to avoid conflicts
  useEffect(() => {
    if (entities.length && contextEntities) {
      setEntities(null)
    }
  }, [entities, contextEntities, setEntities])

  // reduce projectsInfo to selected projects and into one
  const projectInfo = useMemo(
    () => mergeProjectInfo(projectsInfo, activeProjectNames),
    [projectsInfo, activeProjectNames],
  )

  // build icons for entity types (used by the entity path breadcrumb)
  const entityTypeIcons = useMemo(() => buildEntityTypeIcons(projectInfo), [projectInfo])

  // for example when switching from version to task, task doesn't have reps tab
  // if reps tab was selected, set default to feed
  useEffect(() => {
    if (currentTab === 'files') {
      // check entity type is still version
      if (activeEntityType !== 'version') {
        setTab('feed')
      }
    }
    if (currentTab === 'tasks' && activeEntityType !== 'folder') {
      setTab('feed')
    }
    // Reset to feed if subtasks tab is selected but entity is not a task
    if (currentTab === 'subtasks' && activeEntityType !== 'task') {
      setTab('feed')
    }
    // an addon tab that doesn't apply to this entity type (or whose addon is gone)
    if (isAddonDetailsPanelTab(currentTab) && !isLoadingAddonTabs && !activeAddonTab) {
      setTab(entitiesWithoutFeed.includes(activeEntityType) ? 'details' : 'feed')
    }
  }, [activeEntityType, currentTab, scope, isLoadingAddonTabs, activeAddonTab])

  // now we get the full details data for selected entities
  let entitiesToQuery = activeEntities.length
    ? activeEntities.map((entity) => ({ id: entity.id, projectName: entity.projectName }))
    : // @ts-expect-error = not sure what's going on with activeEntitiesData, we should try and remove it
      activeEntitiesData.map((entity) => ({ id: entity.id, projectName: entity.projectName }))

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
    if (!isSlideOut && syncWithPage) {
      closeSlideOut()
    }
  }, [originalArgs, isSlideOut])

  // fire onUriOpen once per context entity — a details refetch must not re-run the jump/filter reset
  const uriOpenFiredForId = useRef<string | null>(null)
  useEffect(() => {
    if (!contextEntities) uriOpenFiredForId.current = null
  }, [contextEntities])

  // if the details panel is opened via the uri, run callback
  useEffect(() => {
    if (isFetchingEntitiesDetails) return

    if (
      (contextEntities?.source === 'uri' || contextEntities?.source === 'url') &&
      contextEntities?.entities?.length &&
      !!onUriOpen
    ) {
      const targetId = contextEntities.entities[0].id
      if (uriOpenFiredForId.current === targetId) return

      const uriEntity = entityDetailsData.find((entity) => entity.id === targetId)
      if (!uriEntity) return

      uriOpenFiredForId.current = targetId
      onUriOpen(uriEntity, contextEntities.source)
    }
  }, [entityDetailsData, isFetchingEntitiesDetails, contextEntities, onUriOpen])

  // TODO:  merge current entities data with fresh details data

  const allStatuses = getAllProjectStatuses(projectsInfo)

  // get the first project name and info to be used in the feed.
  const firstProject = activeProjectNames[0]
  const firstProjectInfo = projectsInfo[firstProject] || {}
  const firstEntityData = entityDetailsData[0] || {}
  // Use the last entity for URI sync
  const lastEntityData = entityDetailsData[entityDetailsData.length - 1]
  const lastProject = activeProjectNames[activeProjectNames.length - 1]

  const newerLatestVersion =
    scope === 'inbox' && activeEntityType === 'version' && entityDetailsData.length === 1
      ? getNewerLatestVersion(entityDetailsData[0])
      : undefined

  // build the full entity path for the first entity
  const [entityPathSegments, entityPathVersions] = useGetEntityPath({
    entity: firstEntityData,
    entityType: activeEntityType,
    projectName: firstProject,
    isLoading: isFetchingEntitiesDetails,
  })

  const { setEntityUri, setUri } = useURIContext()
  // sync the uri when entity changes
  useEffect(() => {
    if (!syncWithPage) return
    if (!lastEntityData?.parents) return
    if (!lastProject) return
    const { folderPath, taskName, versionName, productName } = extractEntityHierarchyFromParents(
      lastEntityData.parents,
      activeEntityType,
      lastEntityData.name,
    )

    setEntityUri({
      projectName: lastProject,
      folderPath: folderPath,
      taskName: taskName,
      productName: productName,
      versionName: versionName,
    })

    // unmount cleanup: clear uri
    return () => {
      setUri('')
    }
  }, [entityDetailsData, activeProjectNames, activeEntityType])

  // sync the details panel url (panel) with entity
  useDetailsPanelURLSync({
    entityData: syncWithPage ? lastEntityData : undefined,
    project: lastProject,
    activeEntityType,
    entitiesToQuery,
  })

  const clearSearchUrl = () => {
    // remove URL params when closing
    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev)
        newParams.delete('project')
        newParams.delete('type')
        newParams.delete('id')
        return newParams
      },
      { replace: true },
    )
  }

  const handleClose = () => {
    onClose?.()
    if (!syncWithPage) return
    // also remove any entities in context
    setEntities(null)
    // drop the uri so an in-flight resolve can't reopen the panel after close
    setUri('')
    clearSearchUrl()
    closeSlideOut()
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        // Don't trigger if we're in an input element
        const target = e.target as HTMLElement
        const isInputElement =
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable

        if (isInputElement) return

        // don't trigger if the viewer is open and panel not in slideout mode
        if (isSlideOut === false && (target.closest('#viewer-dialog') || !!slideOut)) return

        handleClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleClose, isSlideOut, slideOut])

  const { requestPipWindow } = usePiPWindow()

  // Hoisted so ThumbnailUploadProvider (wrapping the toolbar) and EntityPanelUploader
  // (inside DetailsPanelHeader) share the same ref identity — otherwise the toolbar's
  // more-menu, which sits as a sibling above the header, can't reach the inputs. The more menu
  // (useDetailsPanelMoreMenu, called here, above the provider) clicks the thumbnail input itself.
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const versionsInputRef = useRef<HTMLInputElement>(null)
  const canUploadVersion = entityDetailsData.length === 1 && activeEntityType !== 'representation'

  const shareEntityLabel = useMemo(() => {
    const name = firstEntityData?.label || firstEntityData?.name || ''
    const parents: string[] = firstEntityData?.parents || []
    const parts: (string | undefined)[] = [firstProject]
    switch (activeEntityType) {
      case 'folder':
      case 'task':
      case 'product':
        parts.push(parents.at(-1), name)
        break
      case 'version':
        parts.push(parents.at(-2), parents.at(-1), name)
        break
      case 'representation':
        parts.push(parents.at(-3), parents.at(-2), parents.at(-1), name)
        break
      default:
        parts.push(name)
    }
    return parts.filter(Boolean).join(' - ')
  }, [firstEntityData, activeEntityType, firstProject])

  const handleOpenPip = () => {
    openPip({
      entityType: activeEntityType,
      entities: entitiesToQuery,
      scope: scope,
    })
    requestPipWindow(480, 720)
  }

  const moreMenu = useDetailsPanelMoreMenu({
    entityType: activeEntityType,
    entityId: firstEntityData?.id,
    entityIds: entitiesToQuery.map((e) => e.id).filter(Boolean),
    entityLabel: shareEntityLabel,
    projectName: firstProject,
    selectedEntities: entityDetailsData
      .filter((e) => !!e?.id)
      .map((e) => {
        const type = e.entityType || activeEntityType
        return {
          entityId: e.id,
          entityType: type,
          hasReviewables: !!e.hasReviewables,
          name: e.name,
          label: e.label,
          projectName: e.projectName || firstProject,
          folderId: type === 'task' ? e.folder?.id : undefined,
        }
      }),
    entityListsContext,
    // the PiP window can't open another one
    onOpenPip: isDetailsPipPage() ? undefined : handleOpenPip,
    onOpenViewer,
    productId: firstEntityData?.product?.id,
    taskId: firstEntityData?.task?.id,
    folderId: firstEntityData?.folder?.id,
    onUploadThumbnail: () => thumbnailInputRef.current?.click(),
    canUploadVersion,
  })

  const addonTabContext = useMemo(
    () => ({
      projectName: firstProject,
      entityType: activeEntityType,
      entities: entityDetailsData
        .filter((entity) => !!entity?.id)
        .map((entity) => ({
          id: entity.id,
          entityType: entity.entityType || activeEntityType,
          projectName: entity.projectName || firstProject,
          name: entity.name,
          label: entity.label || undefined,
        })),
      scope,
    }),
    [firstProject, activeEntityType, entityDetailsData, scope],
  )

  // the addons' tabs with what they get
  const addonTabSlotWithContext = useMemo(
    () => ({ ...addonTabSlot, context: addonTabContext }),
    [addonTabSlot, addonTabContext],
  )

  const isCommentingEnabled = () => {
    // cannot comment on multiple projects
    if (activeProjectNames.length > 1) return false
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

  // the panel's own tabs, by entity type; the feed, subtasks and files tabs draw their own header
  const ownTabs: TabbedPanelTab[] = [
    {
      id: 'feed',
      label: 'Activity',
      icon: 'forum',
      hidden: entitiesWithoutFeed.includes(activeEntityType),
      header: false,
      render: () =>
        !isError && (
          <FeedWrapper
            title="Activity"
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
            isSlideOut={isSlideOut}
          />
        ),
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: 'task_alt',
      hidden: activeEntityType !== 'folder',
      render: () => (
        <DetailsPanelTasks
          projectName={firstProject}
          folders={entityDetailsData}
          projectInfo={firstProjectInfo}
          users={projectUsers}
        />
      ),
    },
    {
      id: 'subtasks',
      label: 'Subtasks',
      icon: 'checklist',
      hidden: activeEntityType !== 'task',
      header: false,
      render: () =>
        firstEntityData?.id &&
        SubtasksManager && (
          <DetailsPanelSubtasks
            projectName={firstProject}
            taskId={firstEntityData.id}
            taskName={firstEntityData.name}
            folderId={firstEntityData.folder?.id}
            subtasks={firstEntityData.task?.subtasks || []}
            SubtasksManager={SubtasksManager}
            useNavigate={useNavigate!}
            onNotFound={() => setTab('feed')} // if subtasks module is not found, switch to feed tab
          />
        ),
    },
    {
      id: 'files',
      label: 'Files',
      icon: 'order_play',
      end: true,
      hidden: activeEntityType !== 'version',
      header: false,
      render: () => (
        <DetailsPanelFiles
          entities={entityDetailsData}
          scope={scope}
          isLoadingVersion={isFetchingEntitiesDetails}
        />
      ),
    },
    {
      id: 'details',
      label: 'Details',
      icon: 'lists',
      end: true,
      showLabel: true,
      header: {
        searchActive: !!detailsSearch,
        search: (
          <PanelTabSearch
            value={detailsSearch}
            onChange={setDetailsSearch}
            placeholder="Search attributes and details..."
          />
        ),
      },
      render: () => (
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
            search={detailsSearch}
          />
        </FeedContextWrapper>
      ),
    },
  ]

  return (
    <ThumbnailUploadProvider
      thumbnailInputRef={thumbnailInputRef}
      versionsInputRef={versionsInputRef}
      canUploadVersion={canUploadVersion}
    >
      <Styled.Panel className="details-panel">
        {/* the addon tabs (TabbedPanel) are in the project too, as the panel's own tabs are */}
        <ProjectContextProvider projectName={firstProject}>
          <TabbedPanel
            title={
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
            }
            tools={[
              ...moreMenu.tools,
              {
                id: 'watchers',
                element: (
                  <Watchers
                    entities={entitiesToQuery}
                    entityType={activeEntityType}
                    options={projectUsers || []}
                    onWatchersUpdate={onWatchersUpdate}
                    userName={user.name}
                  />
                ),
              },
            ]}
            moreButtonProps={moreMenu.moreButtonProps}
            tabTestId={(id) => `details-panel-tab-${id}`}
            // Escape closes it too (above)
            onClose={onClose && handleClose}
            closeShortcut="Escape"
            beforeTabs={
              <>
                {newerLatestVersion && (
                  <NewerVersionBanner
                    latestVersion={newerLatestVersion}
                    resolveVersionJump={resolveVersionJump}
                  />
                )}
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
                  projectInfo={projectInfo}
                  onOpenViewer={(args) => onOpenViewer?.(args)}
                  onEntityFocus={onEntityFocus}
                  thumbnailInputRef={thumbnailInputRef}
                  versionsInputRef={versionsInputRef}
                  wideThumbnail={wideThumbnail}
                />
              </>
            }
            tabs={ownTabs}
            // the panel moves off a tab that doesn't apply to the entity type itself (above)
            slot={addonTabSlotWithContext}
            selected={currentTab}
            onChange={(tab) => setTab(tab as DetailsPanelTab)}
            isLoading={!entityDetailsData.length || isFetchingEntitiesDetails}
          />
          {moreMenu.dialogs}
        </ProjectContextProvider>
      </Styled.Panel>
    </ThumbnailUploadProvider>
  )
}

// create a wrapper that checks if the details panel should be open or not based on isOpen prop and entities state
export const DetailsPanel = ({
  isOpen,
  entityType,
  ...props
}: Omit<DetailsPanelProps, 'entityType'> & {
  entityType?: DetailsPanelEntityType
  isOpen: boolean
}) => {
  const { entities } = useDetailsPanelContext()

  if (!isOpen && !entities) return null
  if (!entityType && !entities) return null

  return <DetailsPanelInner {...props} entityType={entityType || entities?.entityType} />
}
