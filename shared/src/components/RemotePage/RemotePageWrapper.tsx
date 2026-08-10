// this is used to render a remote page and provide it with all the props it needs
// NOTE: it must be wrapped with ViewsProvider someone (probably already by WithViews hoc)
import { GenericViewModel } from '@shared/api'
import {
  DetailsPanelEntityContextType,
  updateViewSettings,
  UpdateViewSettingsFn,
  useDetailsPanelEntityContext,
  useViewsContext,
  useViewUpdateHelper,
  ViewsContextValue,
} from '@shared/containers'
import { DetailsPanelContextType, useDetailsPanelContext } from '@shared/context'
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

export interface RemotePageProps {
  router: RouterTypes
  toast?: any
  views?: ViewsWithReportsSettings
  context: RemotePageContext
  dispatch?: any
  useSelector?: any
  onOpenImage?: (args: any) => void
  onGoToFrame?: (frame: number) => void
  onOpenViewer?: (args: any) => void
  onUpdateEntity?: (data: { operations: any[]; entityType: string }) => void
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
      toast={toast}
      {...props}
    />
  )
}
