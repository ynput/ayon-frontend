// this is used to render a remote page and provide it with all the props it needs
// NOTE: it must be wrapped with ViewsProvider someone (probably already by WithViews hoc)
import type { DetailsPanelEntityType, GenericViewModel } from '@shared/api'
import { useViewsContext } from '@shared/containers/Views/context'
import {
  updateViewSettings,
  useViewUpdateHelper,
} from '@shared/containers/Views/utils/viewUpdateHelper'
import type { DetailsPanelEntityContextType } from '@shared/containers/ProjectTreeTable/context/details-panel-entity'
import type { UpdateViewSettingsFn } from '@shared/containers/Views/utils/viewUpdateHelper'
import type { ViewsContextValue } from '@shared/containers/Views/context'
import type { DetailsPanelContextType } from '@shared/context'
import { FC } from 'react'
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'

export type RouterTypes = {
  useParams: typeof useParams
  useNavigate: typeof useNavigate
  useLocation: typeof useLocation
  useSearchParams: typeof useSearchParams
}

interface ViewsWithReportsSettings extends ViewsContextValue {
  viewSettings: GenericViewModel['settings'] | undefined
  settings: GenericViewModel['settings'] | undefined // for backwards compatibility (reports)
  updateViewSettings: UpdateViewSettingsFn
}

export interface RemotePageContext {
  detailsPanel?: DetailsPanelContextType
  detailsPanelEntity?: DetailsPanelEntityContextType
}

/** What the details panel shows: entities of one type in the page's project. */
export interface RemoteDetailsPanelEntities {
  entityType: DetailsPanelEntityType
  entityIds: string[]
}

/** The host's details panel. Calling open again shows other entities, e.g. to follow a selection. */
export interface RemoteDetailsPanel {
  isOpen: boolean
  entities: RemoteDetailsPanelEntities | null
  open: (entities: RemoteDetailsPanelEntities) => void
  close: () => void
}

/** What the viewer opens: a folder, task or product, optionally with versions selected. */
export interface RemoteViewerTarget {
  projectName?: string
  folderId?: string
  taskId?: string
  productId?: string
  selectedProductId?: string
  versionIds?: string[]
  reviewableIds?: string[]
  quickView?: boolean
}

/** The host's viewer (player). */
export interface RemoteViewer {
  isOpen: boolean
  open: (target: RemoteViewerTarget) => void
  close: () => void
}

export interface RemotePageProps {
  router: RouterTypes
  toast?: any
  views?: ViewsWithReportsSettings
  context?: RemotePageContext
  dispatch?: any
  useSelector?: any
  onOpenImage?: (args: any) => void
  onGoToFrame?: (frame: number) => void
  onOpenViewer?: (args: any) => void
  onUpdateEntity?: (data: { operations: any[]; entityType: string }) => void
  // host UI blocks, when the page's host has them
  detailsPanel?: RemoteDetailsPanel
  viewer?: RemoteViewer
  // project specific
  projectName?: string
  state?: any
}

export interface RemotePageWrapperProps {
  Component: FC<RemotePageProps>
  // project specific
  projectName?: string
  state?: any
  dispatch?: any
  useSelector?: any
  onOpenImage?: (args: any) => void
  onGoToFrame?: (frame: number) => void
  onOpenViewer?: (args: any) => void
  onUpdateEntity?: (data: { operations: any[]; entityType: string }) => void
  detailsPanel?: RemoteDetailsPanel
  viewer?: RemoteViewer
}

export const RemotePageWrapper: FC<RemotePageWrapperProps> = ({
  Component,
  projectName,
  state,
  dispatch,
  useSelector,
  onOpenImage,
  onGoToFrame,
  onOpenViewer,
  onUpdateEntity,
  detailsPanel,
  viewer,
  ...props
}) => {
  const views = useViewsContext()
  const { onCreateView, getLatestSettings, markCacheDirty } = useViewUpdateHelper()

  return (
    <Component
      router={{ useParams, useNavigate, useLocation, useSearchParams }}
      projectName={projectName}
      views={{
        ...views,
        settings: views.viewSettings,
        updateViewSettings: (...args) =>
          updateViewSettings(...args, views, onCreateView, getLatestSettings, markCacheDirty),
      }}
      context={{}}
      state={state}
      dispatch={dispatch}
      useSelector={useSelector}
      onOpenImage={onOpenImage}
      onGoToFrame={onGoToFrame}
      onOpenViewer={onOpenViewer}
      onUpdateEntity={onUpdateEntity}
      detailsPanel={detailsPanel}
      viewer={viewer}
      toast={toast}
      {...props}
    />
  )
}
